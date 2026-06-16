export default function DefaultBlock(props) {
    return (
        <p {...props.attributes}>
            {...props.children}
        </p>
    )
}