export default function BenefitBlock({ text, Icon }) {

    return (
        <div className='shadow border-1 flex border-gray-200
         bg-white rounded py-2 justify-center items-center gap-2 text-gray-700'>
            <span>{text}</span>
            {Icon && <Icon />} 
            {/* Renderujemy ikone tylko jeśli została przekazana */}
        </div>
    )
}