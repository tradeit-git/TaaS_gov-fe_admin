'use client'
import React, {forwardRef, useEffect, useImperativeHandle, useState} from 'react';
import {TxEditor, TxEditorController} from "@/components/txContent/TxEditor";

export interface TopicContentFormHandle {
    getEntry: () => { seq: number; topic: string; content: string };
}

interface Props {
    entry: { seq: number; topic: string; content: string };
}

const TopicContentForm = forwardRef<TopicContentFormHandle, Props>(
    (props, ref) => {
        const [txEditorController, setTxEditorController] = useState<TxEditorController>({
            setContent: () => {},
            getContent: () => "",
        });

        const [entry, setEntry] = useState(props.entry);
        const [txIframeId, setTxIframeId] = useState(`TopicContentForm_${props.entry.seq}`);

        useEffect(() => {
            setEntry(props.entry);
            setTxIframeId(`TopicContentForm_${props.entry.seq}`);
        }, [props.entry]);

        useImperativeHandle(ref, () => ({
            getEntry: () => {
                return {...entry, content: txEditorController.getContent()}
            }
        }));
        return (
            <div className="txt_area_box">
                <div className="content">
                    <span>분석 주제에 대한 내용을 입력하세요.</span>
                    <TxEditor iframeId={txIframeId} initContent={entry.content}
                              setTxEditorController={setTxEditorController} customHeight={650}/>
                </div>
            </div>
        )
    });

TopicContentForm.displayName = 'TopicContentForm';

export default TopicContentForm;
