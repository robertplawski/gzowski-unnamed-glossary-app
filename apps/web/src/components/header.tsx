import { MenuIcon } from "lucide-react";
import { type SetStateAction } from "react";
const HeaderComponent = ({setter}:{setter:React.Dispatch<SetStateAction<boolean>>}) => {
return(

    <header className="h-15 absolute top-0 flex justify-between p-4 items-center flex-row w-[100%]">
        <span className="text-blue-900 tracking-wide text-3xl font-bold">GUGA</span> <button className="font-bold text-xl h-10 w-10 bg-card text-center flex justify-center rounded-lg border-1 border-ring items-center hover:bg-secondary hover:scale-[105%] transition-all duration-200 hover:duration-200"><MenuIcon onClick={()=> setter(prev => !prev)}size={20}/></button>
    </header>
)
}
export default HeaderComponent;
