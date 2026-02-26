import { useNavigate } from "react-router-dom";
import backgroundImage from '/bgs/bg-different.png';

const CARD_GLASS_ACTIVE = 'bg-white/20 backdrop-blur-sm border border-white/30 text-white shadow-xl';
const BUTTON_GLASS_ACTIVE_SOLID = 'bg-white text-black border border-white/40 shadow-lg';
const CARD_BODY_INACTIVE = 'text-white/80';

export default function Different() {
  const navigate = useNavigate();

  const points = [
    { icon: "/diff1.svg", text: "Members only platform for the NDA Society" },
    { icon: "/diff2.svg", text: "Connect through vibes, not photos" },
    { icon: "/diff3.svg", text: "Your photo is hidden until you make a connection" },
    { icon: "/diff4.svg", text: "Connect with someone locally or globally" },
  ];

  return (
    <div
      className="min-h-screen flex flex-col justify-between items-center p-6"
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

      <div className="relative z-10 flex flex-col items-center justify-start flex-1 w-full pt-20">
        <img
          src="/different.png"
          alt="What makes us different diagram"
          className="w-full max-w-sm object-contain flex-grow mb-4"
        />
      </div>

      <div className={`relative z-20 w-full max-w-sm p-6 pt-8 pb-10 rounded-3xl mt-auto ${CARD_GLASS_ACTIVE}`}>
        <h2 className="text-center text-white font-semibold text-xl mb-6 drop-shadow-md">
          What makes us different
        </h2>

        <div className="w-full space-y-4 mb-8">
          {points.map((item, index) => (
            <div key={index} className="flex items-start space-x-3">
              <img src={item.icon} alt={`diff${index + 1}`} className="h-5 w-5 flex-shrink-0 mt-0.5 filter" />
              <p className={`text-base ${CARD_BODY_INACTIVE} font-light`}>
                {item.text}
              </p>
            </div>
          ))}
        </div>

        <div className="w-full">
          <button
            onClick={() => navigate("/verification")}
            className={`w-full py-4 rounded-xl text-base font-medium transition duration-200 ${BUTTON_GLASS_ACTIVE_SOLID}`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
