import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// @ts-ignore: allow CSS import side effect without type declarations
import './index.css'
import JoinRoom from './JoinRoom.js'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* <TiptapEditor roomId={1} token={"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc4MjU3NDg5MSwiZXhwIjoxNzgyNjYxMjkxfQ._qynaHstsNofgdo8LuXvSo7TX5d-5cy4HYvfa7fNKqk"}/> */}
    <JoinRoom />
  </StrictMode>,
)
