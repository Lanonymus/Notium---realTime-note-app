import { useEffect, useState } from "react"
import { supabase } from "./supabase-client"


export default function Test() {
    const [newTask, setNewTask] = useState({title: "", description: ""})
    const [tasks, setTasks] = useState([])
    const [newDescription, setNewDescription] = useState("")

    const addNewTask = async () => {
        const {data, error} = await supabase.from("tasks").insert(newTask).select()

        if(error) {
            console.error("error while adding task: ", error)
            return
        }

        fetchTasks()
    }

    const fetchTasks = async () => {
        const response = await supabase.from("tasks").select("*")
        const { data, error } = response
        console.log(response);
        

        if(error) {
            console.error("error while fetching tasks: ", error)
            return
        }

        setTasks(data)
    }

    const deleteTask = async (id) => {
        const { error } = await supabase.from("tasks").delete().eq("id", id)

        if(error) {
            console.error("error while deleting task: ", error)
            return
        }
        const filteredTasks = tasks.filter((task) => task.id !== id)
        setTasks(filteredTasks)
    }

    const EditTask = async (id) => {
        const { error } = await supabase.from("tasks").update({
            description: newDescription
        }).eq("id", id)

        if(error) {
            console.error("error while deleting task: ", error)
            return
        }
        fetchTasks()
    }

    useEffect(() => {
        fetchTasks()

    }, [])



    return (
        <>
            <div className="w-screen h-screen flex justify-center items-center bg-gray-800 flex-col gap-3">
                {/* set white font color */}
                <div className="w-[400px] h-[250px] border-1 rounded-[5px] text-white flex justify-center flex-col
                 border-gray-100  items-center gap-1">
                    <h1>Create a new Task</h1>
                    <input onChange={(e) => setNewTask((prev) => ({title: e.target.value, description: prev.description})) } type="text" className="border-1 border-white p-1 text-[15px]" placeholder="Enter Title"></input>
                    <textarea onChange={(e) => setNewTask((prev) => ({title: prev.title, description: e.target.value })) } type="text" className="border-1 border-white p-1 text-[15px]" placeholder="Enter Title"></textarea>
                    <button onClick={() => addNewTask()} className="border-1 border-gray-300 px-3">Submit</button>
                </div>

                <div className="flex gap-3">

                {tasks.map((task, key) => {
                    return (
                        <div key={key} className="w-[250px] h-fit border-1 p-1 rounded-[5px] text-white flex justify-center flex-col
                        border-gray-100  items-center gap-1">
                            <h1>A task</h1>
                            <div type="text" className="w-[200px] border-1 border-white p-1 text-[15px]" placeholder="Enter Title">{task.title}</div>
                            <div type="text" className="w-[200px] border-1 border-white p-1 text-[15px]" placeholder="Enter Title">{task.description}</div>
                            <textarea onChange={(e) => setNewDescription(e.target.value)} type="text" className="w-[200px] border-1 border-white p-1 text-[15px]" placeholder="Edit description"></textarea>
                            <div className="flex gap-2">
                                <button className="border-1 border-gray-300 px-3" onClick={() => deleteTask(task.id)} >Delete task</button>
                                <button className="border-1 border-gray-300 px-3" onClick={() => EditTask(task.id)}>Edit</button>
                            </div>
                        </div>
                    )
                })}

                </div>

            </div>
        </>
    )
}