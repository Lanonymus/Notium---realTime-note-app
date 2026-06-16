export default function TextFont({ attributes, children, leaf }){


    const style = {
        fontFamily: leaf.fontFamily || 'inherit',
        fontWeight: leaf.bold ? 'bold' : 'normal',
        fontStyle: leaf.italic ? 'italic' : 'normal',
        fontSize: leaf.fontSize ? `${leaf.fontSize}px` : 'inherit',
        color: leaf.fontColor ?  leaf.fontColor : 'inherit'
    }

    return <span {...attributes} style={style}>{children}</span>
}