'use client'

import Image from "next/image";
import {useLoadingStore} from "@/stores/common/loadingStore";
import {APP_URL} from "@/lib/routes";
export default function Loading() {

    const {isLoading} = useLoadingStore();

    return(
        <>
            {
                isLoading ? <div className='loading_box'>

                <div className={'img_box'}><Image width={200} height={175} alt={'loadingImg'}
                                                      src={`${APP_URL}/static/img/loading.png`} className='loading_img'/></div>
                </div>
                    : ""
            }
        </>
    )
}