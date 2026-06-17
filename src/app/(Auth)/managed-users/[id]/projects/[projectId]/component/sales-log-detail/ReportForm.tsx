'use client'
import React, {Dispatch, useEffect, useRef, useState} from 'react';
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import {BuyerSalesLogType} from "@/types/buyer/buyerSalesLog";
import {replaceBase64Images, TxEditor, TxEditorController} from "@/components/txContent/TxEditor";
import {BuyerSalesLogFileType} from "@/types/buyer/buyerSalesLogFile";
import {FileSchema} from "@/types/file";
import {useProjectTrackerStore} from "@/stores/projectTrackerStore";
import callApi from "@/utill/apiRequest";
import {useLoadingStore} from "@/stores/common/loadingStore";
import {fetchProject} from "@/app/(Auth)/managed-users/[id]/projects/[projectId]/component/PageComponent";

export default function ReportForm(props: {
    buyerSalesLog: BuyerSalesLogType;
    onSelect: Dispatch<number>;
}) {
    const {setIsLoading} = useLoadingStore();
    const {addPopup} = usePopupStore();
    const {selectedProject,setSelectedProject,setBuyers, selectedBuyerId} = useProjectTrackerStore();

    const [buyerSalesLog, setBuyerSalesLog] = useState(props.buyerSalesLog);

    useEffect(() => {
        setBuyerSalesLog(props.buyerSalesLog);
        setTxIframeId(`buyerSalesLog_${props.buyerSalesLog.id}`);
    }, [props.buyerSalesLog]);

    const [txIframeId, setTxIframeId] = useState(`buyerSalesLog_${props.buyerSalesLog.id}`);
    const [txEditorController, setTxEditorController] = useState<TxEditorController>({
        setContent: () => {
        },
        getContent: () => "",
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const MAX_UPLOAD_CNT = 2;
        const MAX_UPLOAD_SIZE = 500 * 1024 * 1024;
        const files = e.target.files; // 선택된 파일들
        if (files) {
            if (buyerSalesLog.files.length + files.length > MAX_UPLOAD_CNT) {
                addPopup(<AlertComponent alertType={"error"} infoContent={`파일은 최대 ${MAX_UPLOAD_CNT}개까지 등록 가능합니다.`}/>)
                return false;
            }
            const addFiles: BuyerSalesLogFileType[] = [];
            let addFileSize = 0;
            for (const file of files) {
                const fileSchema = FileSchema.parse({});
                fileSchema.file = file;
                fileSchema.fileName = file.name;
                fileSchema.fileSize = file.size;
                addFileSize += fileSchema.fileSize;
                addFiles.push({id: 0, s3File: fileSchema});
            }

            const totalFileSize = addFileSize + buyerSalesLog.files.reduce(
                (acc, file) => acc + file.s3File.fileSize, 0);
            if (totalFileSize > MAX_UPLOAD_SIZE) {
                addPopup(<AlertComponent alertType={"error"} infoContent={"최대 업로드 용량은 500MB 입니다."}/>)
                return false;
            } else {
                setBuyerSalesLog({...buyerSalesLog, files: [...buyerSalesLog.files, ...addFiles]});
            }
        }
        // input 초기화
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    const handleDeleteFile = (deleteIndex: number) => {
        const files = buyerSalesLog.files.filter(
            (_, index) => index !== deleteIndex);
        setBuyerSalesLog({...buyerSalesLog, files: files});
    };

    const handleSaveSalesLog = async () => {
        const saveBuyerSalesLog = {...buyerSalesLog};
        saveBuyerSalesLog.content = txEditorController.getContent().trim();
        if (!saveBuyerSalesLog.title.trim()) {
            alert('제목을 입력해주세요');
            return;
        }
        if (!saveBuyerSalesLog.date.trim()) {
            alert('작성일을 선택해주세요');
            return;
        }

        if (!saveBuyerSalesLog.content) {
            alert('본문 내용을 입력해주세요');
            return;
        }

        setIsLoading(true);
        {
            //본문에 복붙한 이미지가 있을경우 서버에 저장하고 이미지 url로 치환
            saveBuyerSalesLog.content = await replaceBase64Images(saveBuyerSalesLog.content);
        }

        //setIsLoading(true);
        const formData = new FormData();
        const uploadFiles = saveBuyerSalesLog.files.map(file => file.s3File.file);
        saveBuyerSalesLog.files = saveBuyerSalesLog.files.filter((file) => file.id !== 0);
        uploadFiles.forEach(file => {
            if (file) formData.append("uploadFiles", file);
        });
        formData.append("buyerSalesLog", new Blob([JSON.stringify(saveBuyerSalesLog)], {type: "application/json"}));
        const options: RequestInit = {
            method: 'POST',
            credentials: 'include',
            body: formData
        }

        const apiRes = await callApi(`/api/admin/managed-users/${useProjectTrackerStore.getState().userId}/projects/${selectedProject.id}/buyer/${selectedBuyerId}/salesLog/store`, options);

        if (apiRes.result) {
            const apiData = apiRes.data as BuyerSalesLogType;
            fetchProject(selectedProject.id).then( res => {
                const {project : _project,buyers : _buyers} = res;
                setSelectedProject(_project);
                setBuyers(_buyers);
                props.onSelect(apiData.id);
                addPopup(<AlertComponent alertType={"confirm"} infoContent={"저장 되었습니다"}/>);
                setIsLoading(false)
            });
        } else {
            if (apiRes.message) {
                addPopup(<AlertComponent alertType={"error"} infoContent={apiRes.message}/>);
                setIsLoading(false)
            }
        }

        return apiRes.result;
    }

    const handleDeleteSalesLog = () => {
        const callback = async () => {
            const options: RequestInit = {
                method: 'POST',
                credentials: 'include',
            }
            const apiRes = await callApi(`/api/admin/managed-users/${useProjectTrackerStore.getState().userId}/projects/${selectedProject.id}/buyer/${selectedBuyerId}/salesLog/${props.buyerSalesLog.id}/delete`, options);
            if (apiRes.result) {
                fetchProject(selectedProject.id).then( res => {
                    const {project : _project,buyers : _buyers} = res;
                    setSelectedProject(_project);
                    setBuyers(_buyers);
                    props.onSelect(0);
                    addPopup(<AlertComponent alertType={"confirm"} infoContent={"삭제 되었습니다"}/>);
                });
            }

        }
        addPopup(<AlertComponent alertType={'alert'} infoContent={'삭제하시겠습니까?'} callback={callback}/>)
    }


    // 파일 입력 필드에 대한 참조는 하나만 있으면 됩니다.
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="report-write">
            <ul>
                <li className={'title'}>
                    <span>활동 타이틀명</span>
                    <input type="text"
                           value={buyerSalesLog.title ?? ""}
                           onChange={(e) => {
                               setBuyerSalesLog({...buyerSalesLog, title: e.target.value.trimStart()});
                           }}
                    />
                </li>
                <li className={'date'}>
                    <span>활동일자</span>
                    <input type="date"
                           value={buyerSalesLog.date ?? ""}
                           onChange={(e) => {
                               setBuyerSalesLog({...buyerSalesLog, date: e.target.value});
                           }}
                    />
                </li>
                <li className={'tag'}>
                    <span>관련태그</span>
                    <select value={buyerSalesLog.topic ?? ""}
                            onChange={(e) => {
                                setBuyerSalesLog({...buyerSalesLog, topic: e.target.value});
                            }}>
                        <option value="Pre-sales">Pre-sales</option>
                        <option value="Inquiry">Inquiry</option>
                        <option value="RFQ">RFQ</option>
                        <option value="Quotation">Quotation</option>
                    </select>
                </li>
                <li className={'content'} style={{padding: 0}}>
                    <span>상세정보</span>
                    <TxEditor iframeId={txIframeId} iframeHeight={700} initContent={buyerSalesLog.content ?? ""}
                              setTxEditorController={setTxEditorController}/>
                </li>
            </ul>
            <div className={'file_box'}>
                {/* 하나의 파일 첨부 버튼 및 input 필드 */}
                <div className="file_attachment">
                    <label htmlFor={"file_attatch"} className={'file_btn'}>파일 선택</label>
                    <input
                        className="file_input"
                        readOnly={true}
                    />
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="file_input"
                        id="file_attatch"
                        multiple // 여러 파일을 선택할 수 있게 설정
                        onChange={handleFileChange} // 파일이 변경될 때 호출
                    />
                    {/* 선택된 파일 목록을 개별적으로 렌더링 */}
                    <div className="selected-files-list">
                        {buyerSalesLog.files.map((file, index) => (
                            <span key={index} className="file-tag">
                                <span className={'file_name'}>{file.s3File?.fileName ?? ""}</span>
                                <span className={'file_delete'} onClick={() => handleDeleteFile(index)}>[삭제]</span>
                            </span>
                        ))}
                    </div>
                </div>
            </div>
            <div className={'btn_box'}>
                {
                    selectedBuyerId !== 0 && (
                        <>
                            {
                                props.buyerSalesLog.id !== 0 && <button onClick={() =>handleDeleteSalesLog()}>delete</button>
                            }
                            <button onClick={handleSaveSalesLog}>save</button>

                        </>
                    )
                }
            </div>
        </div>
    )

}