function InputTextTemplate({ lable, type, placeholder, value, onChange }) {
    return (
        <>
            <label className="text-s font-extrabold text-gray-400">
                {lable}
            </label>

            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className="w-full mt-2 p-4 bg-gray-50 rounded-xl outline-none"
            />
        </>
    )
}

export default InputTextTemplate;