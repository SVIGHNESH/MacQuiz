// Card: Quick link for Admin to add new user (Teacher or Student)
const AddNewUserCard = ({ onAddClick }) => (
    // REMOVED: hover:shadow-2xl transition duration-300 transform hover:scale-[1.01]
    <div className="bg-blue-600/90 text-white p-6 rounded-2xl shadow-xl border border-blue-700 cursor-pointer" onClick={onAddClick}>
        <div className="flex items-center justify-between">
            <div>
                <h3 className="text-xl font-bold">New User Provisioning</h3>
                <p className="text-blue-200 text-sm mt-1">Quickly onboard new teachers or students.</p>
            </div>
        </div>
        {/* Reverted Button text color to blue */}
        <div className="mt-5 w-full bg-white text-blue-800 py-3 rounded-xl text-center font-semibold transition shadow-lg text-lg">
            Add Teacher / Student
        </div>
    </div>
);

export default AddNewUserCard;
