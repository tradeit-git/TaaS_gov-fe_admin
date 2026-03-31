import React from "react";

export type PageNationProps = {
    blockSize?: number;
    totalPage: number,
    curPage: number,
    handlePageMove: (page: number) => void
}

export default function CustomPagination({blockSize = 10, totalPage, curPage, handlePageMove}: PageNationProps) {

    const currentBlock = Math.floor(curPage / blockSize);
    const blockStart = currentBlock * blockSize + 1;
    const blockEnd = Math.min(blockStart + blockSize - 1, totalPage);

    return (
        <nav>
            <ul className="pagination">
                {/* 이전 블록 이동 버튼 */}
                <li
                    className={`prev_arrow icon_admin ${blockStart === 1 ? 'disabled' : ''}`} // 첫 블록이면 disabled 클래스 추가
                    onClick={() => handlePageMove(Math.max(blockStart - blockSize, 1))}/>
                {/* 페이지 번호 렌더링 */}
                {Array.from({length: blockEnd - blockStart + 1}, (_, i) => {
                    const page = blockStart + i;
                    return (
                        <li
                            key={page}
                            className={`page_item ${curPage === page ? "on" : ""}`}
                            onClick={() => handlePageMove(page)}>
                            {page}
                        </li>
                    );
                })}
                {/* 다음 블록 이동 버튼 */}
                <li
                    className={`next_arrow icon_admin ${blockEnd === totalPage ? 'disabled' : ''}`} // 마지막 블록이면 disabled 클래스 추가
                    onClick={() => handlePageMove(Math.min(blockStart + blockSize, totalPage))}/>
            </ul>
        </nav>
    )
}