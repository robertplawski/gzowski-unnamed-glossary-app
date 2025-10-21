import { useState } from "react"
import HeaderComponent from "../header"

const LandingPage = () => {
    const[expand,setExpand] = useState<boolean>(false);
return(
    <main className={`h-[100vh] flex text-center justify-center items-center flex-col gap-5`}>
        <HeaderComponent setter={setExpand}></HeaderComponent>
        {expand && "Cwel"}
        <div className="w-[100%]"><span className="text-5xl font-bold">Say "Hello" to</span><span className="ml-3 text-5xl font-bold text-blue-900">GUGA</span></div>
        <span>Your local english learning website!</span>
        <div className="w-[100%] h-[100px] gap-3 flex justify-center items-center"><button className="bg-blue-900 w-30 rounded-lg border-1 border-ring h-10 text-white font-semibold hover:bg-blue-900 hover:scale-[110%] transition-all duration-200">Get Started</button></div>
    </main>
)
}
export default LandingPage