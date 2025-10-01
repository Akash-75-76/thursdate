import { useNavigate } from "react-router-dom";
import backgroundImage from '../../../public/bgs/bg-privacy.png'; 

const CARD_GLASS_ACTIVE = 'bg-white/20 backdrop-blur-sm border border-white/30 text-white shadow-xl';
const BUTTON_GLASS_ACTIVE_SOLID = 'bg-white text-black border border-white/40 shadow-lg';

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div 
      className="h-screen w-screen flex flex-col justify-end items-center p-6"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-black/30 z-0"></div>

      <div className={`relative z-10 w-full max-w-sm p-6 pt-10 pb-8 rounded-3xl mb-6 flex flex-col items-center ${CARD_GLASS_ACTIVE}`}>
        <div className="mb-8">
          <img src="/lock.svg" alt="Lock" className="h-14" />
        </div>

        <div className="flex flex-col items-center justify-center mb-10">
          <p className="text-center text-white font-semibold text-xl max-w-xs mb-3 drop-shadow-md">
            Your Privacy, Our Priority
          </p>
          <p className="text-center text-white/80 text-sm max-w-xs">
            We keep your personal information completely confidential.
          </p>
          <p className="text-center text-white/80 text-sm font-bold mt-1">
            No screenshots are allowed.
          </p>
        </div>

        <div className="w-full">
          <button
            onClick={() => navigate("/different")}
            className={`w-full py-4 rounded-xl text-base font-medium transition duration-200 ${BUTTON_GLASS_ACTIVE_SOLID}`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
