import BackgroundDots from "../BackgroundDots";

export default function NotFoundPage() {


    return (
        <main className=" flex h-[100vh] w-full justify-center items-center relative">
            <BackgroundDots/>
        <div className="text-center z-2 ">
            <p className="font-semibold font-Inter text-2xl text-indigo-600">404</p>
            <h1 className="mt-4 text-5xl font-semibold tracking-tight text-balance
             text-gray-900 sm:text-7xl font-Inter">Page not found</h1>
            <p className="mt-3 text-lg font-medium font-Manrope text-pretty  text-gray-500 sm:text-xl/8">
                Seems like you have went to far.</p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
                <a href="/" className="rounded-md font-Inter bg-indigo-600 px-3.5 py-2.5 text-sm font-semibol
                text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2
                focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                Return to Home Page</a>
            </div>
        </div>
        </main>
    )
}