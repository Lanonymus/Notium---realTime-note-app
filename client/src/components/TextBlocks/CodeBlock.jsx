export default function CodeBlock(props){
    return (
        <pre {...props.attributes} className="bg-gray-50 outline-1 outline-gray-200">
            <code>{props.children}</code>
        </pre>
    )
}
