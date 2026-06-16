import { HugeiconsIcon } from '@hugeicons/react';
import { Comment01Icon  } from '@hugeicons/core-free-icons';
import { ArrowLeft03Icon  } from '@hugeicons/core-free-icons';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export function NavigateDashboard() {
    const navigate = useNavigate()
    const [clicked, setCliked] = useState(false)


    return (
      <div className="z-999">
        <div
          className={`w-[80px] py-1 
            rounded-[4px] outline-1 bg-white flex gap-1 justify-center items-center
            hover:bg-gray-50 cursor-pointer select-none duration-100 ${
              clicked ? "bg-gray-50 outline-gray-400" : "outline-gray-300"
            }`}
          onClick={() => {
            setCliked(true)
            setTimeout(() => navigate('/dashboard'), 50)
          }}
        >
          <div>
            <HugeiconsIcon
              className="text-gray-800"
              size={20}
              icon={ArrowLeft03Icon}
            />
          </div>
          <div className="text-gray-800 text-[14px]">
            save
          </div>
        </div>

      </div>
    )
}