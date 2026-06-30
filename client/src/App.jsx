// import { BrowserRouter, Routes, Route} from 'react-router-dom'


// // import { Home } from './Home'
// import { useEffect, useState } from 'react'
// import LandingPage from './components/old_components/LandingPage';


// function App() {
//   const [user, setUser] = useState(null)

//   // Pobieramy informacje użytkownika
//   useEffect(() => {
//     const token = localStorage.getItem("token");

//     if (!token) return;

//     fetch("http://localhost:8000/api/getUserData", {
//         method: "GET",
//         headers: {
//             "Authorization": token
//         }
//     })
//     .then(res => res.json())
//     .then(data => {
//         if (data.success) {
//             setUser(data.user)
//             console.log('dane z poziomu apki', user);
            
//         } else {
//             console.error("Błąd", data.message);
            
//         }
//     })
//     .catch(err => console.error("Błąd seci", err));
//   }, [])


//     // return username ? <Home username={username}/> : <Login onSubmit={setUsername}/>
//     return (
//       <BrowserRouter>
//         <Routes>
//           <Route path='/' element={<LandingPage/>} />
//           <Route path='/register' element={<RegisterPage/>} />
//           <Route path='/login' element={<LoginPage/>} />
//           <Route path='/dashboard' element={<DashboardPage/>} />
//           {/* <Route path='editor' element={<Home username={user}/>} /> */}

//           {/* In case of invalid link - route */}
//           <Route path='*' element={<NotFoundPage/>}/>
//         </Routes>
//       </BrowserRouter>
//     )
    
//   // return (
//   //   <>
//   //     <Login onSubmit={setUsername}/>
//   //   </>
//   // )
// }

// export default App
