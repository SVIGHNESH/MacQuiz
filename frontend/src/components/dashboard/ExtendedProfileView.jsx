import { getDisplayUserId } from "../../utils/dashboardHelpers";

const ExtendedProfileView = ({ user, profileImage, onPickProfileImage, onRemoveProfileImage }) => {
    const identityValue = user ? getDisplayUserId(user) : 'Not assigned';
    const identityLabel = user?.role === 'student'
        ? 'Student ID'
        : user?.role === 'teacher'
            ? 'Teacher ID'
            : 'Admin Account';

    return (
        <div className="space-y-6">
            <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-lg border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">My Profile</h2>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-blue-600 overflow-hidden flex items-center justify-center text-white font-bold text-4xl shadow-lg ring-4 ring-blue-100">
                        {profileImage ? (
                            <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase() || 'U'
                        )}
                    </div>

                    <div className="min-w-0">
                        <p className="text-xl sm:text-2xl font-semibold text-gray-900 break-words">{user?.first_name} {user?.last_name}</p>
                        <p className="text-sm text-gray-500 break-all">{user?.email}</p>
                        <p className="text-xs text-gray-500 mt-1 capitalize">Role: {user?.role || 'user'}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                        <button
                            onClick={onPickProfileImage}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-semibold"
                        >
                            {profileImage ? 'Change Image' : 'Upload Image'}
                        </button>
                        {profileImage && (
                            <button
                                onClick={onRemoveProfileImage}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm font-semibold"
                            >
                                Remove
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-lg border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Extended Profile View</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Full Name</p>
                        <p className="font-semibold text-gray-900 break-words">{user?.first_name} {user?.last_name}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Email</p>
                        <p className="font-semibold text-gray-900 break-all">{user?.email || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">{identityLabel}</p>
                        <p className="font-semibold text-gray-900 break-words">{identityValue}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Department</p>
                        <p className="font-semibold text-gray-900">{user?.department || 'N/A'}</p>
                    </div>
                    {user?.role === 'student' && (
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <p className="text-xs text-gray-500 mb-1">Class / Year</p>
                            <p className="font-semibold text-gray-900">{user?.class_year || 'N/A'}</p>
                        </div>
                    )}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Account Status</p>
                        <p className={`font-semibold ${user?.is_active ? 'text-green-700' : 'text-red-700'}`}>
                            {user?.is_active ? 'Active' : 'Inactive'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExtendedProfileView;
