import { Code2 } from 'lucide-react';

const SdcTeamSection = () => {
    const backendTeam = [
        'Ritik Kumar',
        'Devang Pathak',
        'Vivek Sharma',
        'Vighnesh Shukla'
    ];

    const frontendTeam = [
        'Dakshita Tiwari',
        'Anjali Tiwari',
        'Rohit',
        'Satyam Diwaker'
    ];

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Software Development Cell (SDC)</h2>
                <p className="text-gray-600">MacQuiz Development Team (Student Contributors)</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Code2 size={20} className="mr-2 text-blue-600" />
                        Backend Team
                    </h3>
                    <ul className="space-y-2">
                        {backendTeam.map((name) => (
                            <li key={name} className="px-3 py-2 rounded-lg bg-blue-50 text-gray-800 font-medium">
                                {name}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Code2 size={20} className="mr-2 text-indigo-600" />
                        Frontend Team
                    </h3>
                    <ul className="space-y-2">
                        {frontendTeam.map((name) => (
                            <li key={name} className="px-3 py-2 rounded-lg bg-indigo-50 text-gray-800 font-medium">
                                {name}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tech Stack Used</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                        <p className="text-sm text-gray-600 mb-1">Backend</p>
                        <p className="text-lg font-semibold text-gray-900">FastAPI</p>
                    </div>
                    <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                        <p className="text-sm text-gray-600 mb-1">Frontend</p>
                        <p className="text-lg font-semibold text-gray-900">React</p>
                    </div>
                    <div className="p-4 rounded-xl bg-green-50 border border-green-100">
                        <p className="text-sm text-gray-600 mb-1">Database</p>
                        <p className="text-lg font-semibold text-gray-900">MySQL/Postgres</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SdcTeamSection;
