const BackgroundDots = ({ customPos, customSize, customGradient }) => {
  return (
    <div className={`
    absolute
    w-full h-full bg-gray-100
    ${customGradient ? customGradient : "[background-image:radial-gradient(rgba(12,12,12,0.2)_1px,transparent_0)]"}
    ${customSize ? customSize : "[background-size:20px_20px]" } ${customPos ? customPos : "[background-position:-0px_-0px]"}`} />
  );
};

export default BackgroundDots;
