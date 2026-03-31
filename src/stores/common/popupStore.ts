import {create} from 'zustand';
import {cloneElement, ReactElement} from "react";

export type PopupType = {
   uId : string,
   el : ReactElement
};

interface PopupStore {
    popups : PopupType[],
    addPopup : <P extends { uId: string }>(
        el: ReactElement<P>
    ) => string;
    closePopup : (uId : string ) => void;
    allClosePopup : () => void;
}

export const usePopupStore = create<PopupStore>((set) => ({
    popups : [],
    addPopup: (el) => {
        const uId =  !el.props.uId ? `popup_${Date.now()}_${Math.random().toString(36).substring(2, 8)}` : el.props.uId ;
        const elWithUid = cloneElement(el, {
            ...el.props,
            uId,
        });
        const popup: PopupType = {
            uId,
            el: elWithUid,
        };
        set((state) => ({
            popups: [...state.popups, popup],
        }));
        return uId;
    },
    closePopup: (uId ) => {
        set((state) => ({
            popups: state.popups.filter((popup) => popup.uId !== uId)
        }));
    },
    allClosePopup : () => {
        set((state) => ({...state, popups : []}));
    }
}));
