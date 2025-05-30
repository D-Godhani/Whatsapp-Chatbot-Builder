import { NavLink } from "react-router-dom";
const Dashboard = () => {
  return (
    <div className="bg-slate-300 max-w-screen min-h-screen text-black overflow-x-hidden">
      <div className="flex md:flex-1/2 lg:flex-2/3 gap-3 pt-5 px-5">
        <NavLink
          to="/mybots"
          className={({ isActive }) =>
            isActive
              ? "text-blue-600 font-semibold"
              : "text-black hover:text-blue-600 transition"
          }
        >
          <div className="bg-white p-6 rounded-lg shadow-md cursor-pointer">
            <h2 className="text-xl font-semibold mb-2">My Bots</h2>
            <p className="text-gray-600">Manage your existing WhatsApp bots.</p>
          </div>
        </NavLink>

        {/* <div className="bg-white p-6 rounded-lg shadow-md cursor-pointer">
          <h2 className="text-xl font-semibold mb-2">Analytics</h2>
          <p className="text-gray-600">View message stats and performance.</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md cursor-pointer">
          <h2 className="text-xl font-semibold mb-2">Integrations</h2>
          <p className="text-gray-600">
            Configure GPT, Twilio, and other tools.
          </p>
        </div> */}
      </div>
    </div>
  );
};

export default Dashboard;
