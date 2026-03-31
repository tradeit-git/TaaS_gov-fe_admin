
export type Pagination<T> = {
    totalPage: number;
    curPage: number;
    perPage: number;
    totalContent : number;
    content: T[];
};