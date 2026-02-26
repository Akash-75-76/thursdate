import { useNavigate } from "react-router-dom";
import backgroundImage from '../../../public/bgs/bg-gateway.png';
import tick from '../../../public/tick.svg';

const CARD_GLASS_ACTIVE = 'bg-white/20 backdrop-blur-sm border border-white/30 text-white shadow-xl';
const BUTTON_GLASS_BORDERED = 'bg-black/20 text-white border border-white/40';

export default function Gateway() {
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
      
      <div className="absolute top-10 w-full text-center z-10">
        <img src="/logo.png" alt="Sundate" className="h-8 mx-auto" />
      </div>

      <div className={`relative z-10 w-full max-w-sm p-6 pb-8 mb-6 rounded-3xl ${CARD_GLASS_ACTIVE}`}>
        <h2 className="text-white text-2xl font-bold mb-4">
          Exclusive Dating Circle
        </h2>

        <p className="text-white text-sm leading-relaxed mb-6 text-center">
          Welcome to the premium dating experience for 35+ professionals. Membership is by invitation only - referrals from existing members are your pathway to join our exclusive community.
        </p>

        <div className="flex items-center mb-10">
          <div className="w-8 h-8 mr-2 flex items-center justify-center rounded-sm">
            <img src={tick} alt="tick" className="w-8 h-8" />
          </div>
          <span className="text-white text-base">Verified members only</span>
        </div>

        <div className="w-full space-y-3">
          <button
            onClick={() => navigate("/privacy")}
            className="w-full py-4 rounded-xl bg-white text-black text-base font-medium transition duration-200 hover:bg-gray-100"
          >
            Request to join
          </button>

          <button
            onClick={() => navigate("/login")}
            className={`w-full py-4 rounded-xl text-base font-medium transition duration-200 hover:bg-black/50 ${BUTTON_GLASS_BORDERED}`}
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
