'use client'

import {Dispatch, useEffect, useRef} from "react";

export interface TxEditorController{
    setContent: (content: string) => void;
    getContent: () => string;
}

// base64 → Blob 변환 함수
function dataURLToBlob(dataURL: string): Blob {
    const [meta, data] = dataURL.split(',');
    const mimeMatch = meta.match(/:(.*?);/);
    if (!mimeMatch) throw new Error("Invalid dataURL format");

    const mime = mimeMatch[1];
    const binary = atob(data);
    const array = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i);
    }

    return new Blob([array], {type: mime});
}

// base64 이미지 src → 업로드된 URL로 교체
export const replaceBase64Images = async  (htmlString: string): Promise<string> => {
    const imgTagRegex = /<img\b[^>]*src=["'](data:image\/[^"']+)["'][^>]*>/gi;

    // 매치된 <img> 태그 정보 수집
    const matches = [...htmlString.matchAll(imgTagRegex)];

    const replacedResults = await Promise.all(
        matches.map(async (match) => {
            const fullImgTag = match[0];      // 전체 <img ...>
            const base64Data = match[1];      // src="..." 내부 값

            const blob = dataURLToBlob(base64Data);
            const formData = new FormData();

            // 반드시 'image.png' 같은 이름을 지정해야 MultipartFile로 정상 매핑됨
            formData.append("image", blob, "uploaded.png");

            const res = await fetch("/admin/api/common/editor/image-upload", {
                method: "POST",
                body: formData,
            });
            if (!res.ok) {
                console.warn("이미지 업로드 실패:", res.status);
                return {original: fullImgTag, replaced: fullImgTag}; // 실패 시 원본 유지
            }

            // 서버가 텍스트 형식의 이미지 URL을 반환한다고 가정
            const uploadedUrl = await res.text();

            // <img src="data:..."> 를 <img src="http..."> 로 치환
            const replacedTag = fullImgTag.replace(base64Data, uploadedUrl);

            return {
                original: fullImgTag,
                replaced: replacedTag
            };
        })
    );

    // 원래 HTML에서 바뀐 태그 적용
    let finalHtml = htmlString;
    for (const {original, replaced} of replacedResults) {
        finalHtml = finalHtml.replace(original, replaced);
    }

    return finalHtml;
}


export function TxEditor( props : {
    iframeId : string,
    iframeHeight? : number,
    initContent : string,
    setTxEditorController : Dispatch<TxEditorController>,
    customHeight?: number;
}){
    const iframeRef = useRef<HTMLIFrameElement>(null);
    // props에서 필요한 값들만 구조 분해
    const { iframeId,iframeHeight, initContent, setTxEditorController } = props;

    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;

        const checkAndCallFunction = setInterval(() => {
            if (
                iframe.contentWindow &&
                typeof (iframe.contentWindow as unknown as TxEditorController).setContent === "function"
            ) {
                const iframeWindow = iframe.contentWindow as unknown as TxEditorController;
                setTxEditorController({
                    setContent: iframeWindow.setContent,
                    getContent: iframeWindow.getContent,
                });
                iframeWindow.setContent(initContent ? initContent : "<div><br></div>");
                clearInterval(checkAndCallFunction);
            }
        }, 10);

        iframe.onload = () => {
            iframe.contentWindow?.postMessage({ iframeId: iframeId,iframeHeight: iframeHeight ?? 465 }, "*");
        };
        return () => clearInterval(checkAndCallFunction);
    }, [iframeId, initContent, setTxEditorController]);

    return (
        <iframe
            ref={iframeRef}
            id={props.iframeId}
            src={`/admin/lib/board-editor/editor.html?height=${props.customHeight || 465}`}
            title="내용"
            width="100%"
            height="100%"
            scrolling="no"
            style={{border: 0}}
        />
    );
}
