export default function TextBold(props) {
  return (
    <span
        {...props.attributes}
        style={{ fontWeight: props.leaf.bold ? 'bold' : 'normal' }}
        >
        {props.children}
        </span>
  )
}