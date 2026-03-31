import styles from "@/components/txContent/tx.module.css"


export default function TxView(props : {
    content : string,
    className? : string,
} ){

    return (<div
        className={`${styles.txView} ${props.className}`.trim()}
        dangerouslySetInnerHTML={{__html: props.content}}
    />)
}