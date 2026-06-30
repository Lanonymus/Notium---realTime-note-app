import BackgroundDots from "./BackgroundDots";
import BenefitSlide from "./BenefitSlide";
import CustomizationSlide from "./CustomizationSlide";
import EndingSlide from "./EndingSlide";
import LandingSlide from "./LandingSlide";
import NavBar from "./NavBar";
import PeopleOnlineSlide from "./PeopleOnlineSlide";

export default function LandingPage() {


    return (
    <>
        <div className="w-full min-h-screen bg-gray-100">
            

            {/* Kratkownica */}
            {/* Tworzymy układ z podkreślnikami a nie przecinkami */}
            <div className="grid grid-cols-[1fr_1250px_1fr] relative"> 

                
                <div className="h-[200px] border-dashed border-gray-300 border-r border-b relative"><BackgroundDots/></div>
                <div><NavBar/><BackgroundDots/></div>
                <div className="border-dashed border-gray-300 border-l border-b relative"><BackgroundDots/></div>

                <div className="border-dashed border-gray-300 border-r border-b relative"><BackgroundDots/></div>
                <LandingSlide/>
                <div className="border-dashed border-gray-300 border-l border-b relative"><BackgroundDots/></div>

                <div className="border-dashed border-gray-300 border-r border-b relative"><BackgroundDots/></div>
                <BenefitSlide/>
                <div className="border-dashed border-gray-300 border-l border-b relative"><BackgroundDots/></div>

                <div className="border-dashed border-gray-300 border-r border-b relative"><BackgroundDots/></div>
                <PeopleOnlineSlide/>
                <div className="border-dashed border-gray-300 border-l border-b relative"><BackgroundDots/></div>

                <div className="border-dashed border-gray-300 border-r border-b relative"><BackgroundDots/></div>
                <CustomizationSlide/>
                <div className="border-dashed border-gray-300 border-l border-b relative"><BackgroundDots/></div>

                <div className="border-dashed border-gray-300 border-r border-b relative"><BackgroundDots/></div>
                <EndingSlide/>
                <div className="border-dashed border-gray-300 border-l border-b relative"><BackgroundDots/></div>

            </div>
            
        </div>
    </>
    )
}