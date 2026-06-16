export function Cursor({ point, name, color}) {
  
  // console.log('Punkt kursora',point, 'nazwa użytkownika: ', name);
  const x = point[0]
  const y = point[1] - 10
  

  return <>
    <div className=" absolute z-900
     transition-transform duration-150 ease-in-out pointer-events-none"
     style={{
      transform: `translate(${x}px, ${y}px)`
     }}>
      {/* <div className="w-3 h-3 bg-blue-400 rounded-[50%]"></div> */}

      <svg
        width="18"
        height="19"
        viewBox="0 0 18 19"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0.22033 3.02709L4.59403 17.4603C5.06656 19.0196 7.05862 19.4688 8.15466 18.2632L16.9021 8.64108C17.9041 7.5388 17.4704 5.7725 16.0718 5.25966L2.95072 0.4486C1.32539 -0.147356 -0.281717 1.37034 0.22033 3.02709Z"
          fill={color} 
        />
      </svg>

      <div className="px-3 py-1 text-[13px] rounded-[12px] text-white ml-[15px]"
       style={{ background: color}}>{name}</div>
    </div>

  </>
}





// // components/Cursor

// import * as React from "react"
// import { usePerfectCursor } from "../hooks/useCursor"

// export function Cursor({ point }) {
//   const rCursor = React.useRef(null)

//   const animateCursor = React.useCallback((point) => {
//     const elm = rCursor.current
//     if (!elm) return
//     elm.style.setProperty(
//       "transform",
//       `translate(${point[0]}px, ${point[1]}px)`
//     )
//   }, [])

//   const onPointMove = usePerfectCursor(animateCursor)

//   React.useLayoutEffect(() => onPointMove(point), [onPointMove, point])

//   return (
//     <svg
//       ref={rCursor}
//       style={{
//         position: "absolute",
//         top: -15,
//         left: -15,
//         width: 35,
//         height: 35,
//       }}
//       xmlns="http://www.w3.org/2000/svg"
//       viewBox="0 0 35 35"
//       fill="none"
//       fillRule="evenodd"
//     >
//       <g fill="rgba(0,0,0,.2)" transform="translate(1,1)">
//         <path d="m12 24.4219v-16.015l11.591 11.619h-6.781l-.411.124z" />
//         <path d="m21.0845 25.0962-3.605 1.535-4.682-11.089 3.686-1.553z" />
//       </g>
//       <g fill="white">
//         <path d="m12 24.4219v-16.015l11.591 11.619h-6.781l-.411.124z" />
//         <path d="m21.0845 25.0962-3.605 1.535-4.682-11.089 3.686-1.553z" />
//       </g>
//       <g fill={"red"}>
//         <path d="m19.751 24.4155-1.844.774-3.1-7.374 1.841-.775z" />
//         <path d="m13 10.814v11.188l2.969-2.866.428-.139h4.768z" />
//       </g>
//     </svg>
//   )
// }