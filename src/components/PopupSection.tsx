'use client'

import {usePopupStore} from "@/stores/common/popupStore";
import {useEffect, useState} from "react";
import {ReadonlyURLSearchParams, usePathname, useSearchParams} from "next/navigation";

export default function PopupSection() {
    const pathname = usePathname();
    const [curPathname, setCurPathname] = useState("");

    const searchParams = useSearchParams();
    const [curSearchParams , setCurSearchParams] = useState<ReadonlyURLSearchParams>();

    const { popups, closePopup, allClosePopup} = usePopupStore();

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                if(popups.length > 0 ){
                    const popupUid = popups[popups.length -1].uId;
                    closePopup(popupUid);
                }
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [popups,closePopup]);

    useEffect(() => {
        if(pathname != curPathname) {
            allClosePopup();
            setCurPathname(pathname);
        }
    }, [curPathname,pathname,allClosePopup]);
    useEffect(() => {
        if(searchParams != curSearchParams) {
            allClosePopup();
            setCurSearchParams(searchParams);
        }
    }, [curSearchParams,searchParams,allClosePopup]);

    return (
        <>
            {
                popups.length > 0 ? popups.map(popup => <section key={popup.uId} className={"popup_section"}>{popup.el}</section>) : ""
            }
        </>
    )
}