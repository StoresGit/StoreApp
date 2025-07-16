import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import backend_url from '../config/config';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalItems: 0,
    totalUsers: 0,
    totalBranches: 0,
    totalOrders: 0,
    recentActivity: [],
    lowStock: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');

  useEffect(() => {
    fetchDashboardData();
  }, [selectedTimeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch dashboard statistics
      const [itemsRes, usersRes, branchesRes] = await Promise.all([
        axios.get(`${backend_url}/items`).catch(() => ({ data: [] })),
        axios.get(`${backend_url}/users`).catch(() => ({ data: [] })),
        axios.get(`${backend_url}/branch`).catch(() => ({ data: [] }))
      ]);

      setStats({
        totalItems: itemsRes.data?.length || 0,
        totalUsers: usersRes.data?.length || 0,
        totalBranches: branchesRes.data?.length || 0,
        totalOrders: Math.floor(Math.random() * 100) + 50, // Mock data
        recentActivity: [
          { id: 1, action: 'New item added', user: 'John Doe', time: '2 hours ago' },
          { id: 2, action: 'Order placed', user: 'Jane Smith', time: '3 hours ago' },
          { id: 3, action: 'User registered', user: 'Bob Johnson', time: '5 hours ago' },
          { id: 4, action: 'Branch updated', user: 'Alice Brown', time: '1 day ago' }
        ],
        lowStock: [
          { id: 1, name: 'Coffee Beans', stock: 5, minStock: 20 },
          { id: 2, name: 'Sugar', stock: 12, minStock: 50 },
          { id: 3, name: 'Milk', stock: 8, minStock: 30 }
        ]
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, trend }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm md:text-base font-medium text-gray-600">{title}</p>
          <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && (
            <div className="flex items-center mt-2">
              <span className={`text-xs md:text-sm ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.positive ? '↗' : '↘'} {trend.value}%
              </span>
              <span className="text-xs text-gray-500 ml-1">vs last period</span>
            </div>
          )}
        </div>
        <div className={`p-3 md:p-4 rounded-full ${color}`}>
          <span className="text-xl md:text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );

  const ActivityCard = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
      <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Recent Activity</h3>
      <div className="space-y-3 md:space-y-4">
        {stats.recentActivity.map((activity) => (
          <div key={activity.id} className="flex items-center space-x-3 md:space-x-4">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-sm md:text-base">📝</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm md:text-base font-medium text-gray-900 truncate">{activity.action}</p>
              <p className="text-xs md:text-sm text-gray-500">by {activity.user}</p>
            </div>
            <span className="text-xs md:text-sm text-gray-400 whitespace-nowrap">{activity.time}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const LowStockCard = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
      <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Low Stock Alert</h3>
      <div className="space-y-3 md:space-y-4">
        {stats.lowStock.map((item) => (
          <div key={item.id} className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm md:text-base font-medium text-gray-900">{item.name}</p>
              <p className="text-xs md:text-sm text-gray-500">Min: {item.minStock} units</p>
            </div>
            <div className="text-right">
              <p className="text-sm md:text-base font-bold text-red-600">{item.stock}</p>
              <p className="text-xs text-gray-500">in stock</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const QuickActions = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
      <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <button className="flex flex-col items-center p-3 md:p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
          <span className="text-2xl md:text-3xl mb-2">📦</span>
          <span className="text-xs md:text-sm font-medium text-gray-700">Add Item</span>
        </button>
        <button className="flex flex-col items-center p-3 md:p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
          <span className="text-2xl md:text-3xl mb-2">👥</span>
          <span className="text-xs md:text-sm font-medium text-gray-700">Add User</span>
        </button>
        <button className="flex flex-col items-center p-3 md:p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
          <span className="text-2xl md:text-3xl mb-2">🏢</span>
          <span className="text-xs md:text-sm font-medium text-gray-700">Add Branch</span>
        </button>
        <button className="flex flex-col items-center p-3 md:p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
          <span className="text-2xl md:text-3xl mb-2">📊</span>
          <span className="text-xs md:text-sm font-medium text-gray-700">View Reports</span>
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Welcome back, {user?.name || 'User'}!
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Here's what's happening with your business today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          title="Total Items"
          value={stats.totalItems}
          icon="📦"
          color="bg-blue-100"
          trend={{ positive: true, value: 12 }}
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon="👥"
          color="bg-green-100"
          trend={{ positive: true, value: 8 }}
        />
        <StatCard
          title="Total Branches"
          value={stats.totalBranches}
          icon="🏢"
          color="bg-purple-100"
          trend={{ positive: false, value: 3 }}
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          icon="🛒"
          color="bg-orange-100"
          trend={{ positive: true, value: 15 }}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Left Column - Takes 2/3 on desktop */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          <ActivityCard />
          
          {/* Chart Placeholder */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Sales Overview</h3>
            <div className="h-64 md:h-80 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <span className="text-4xl md:text-6xl mb-4 block">📈</span>
                <p className="text-sm md:text-base text-gray-600">Chart visualization coming soon</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Takes 1/3 on desktop */}
        <div className="space-y-6 md:space-y-8">
          <QuickActions />
          <LowStockCard />
          
          {/* System Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">System Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm md:text-base text-gray-600">Server Status</span>
                <span className="flex items-center text-green-600">
                  <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
                  Online
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm md:text-base text-gray-600">Database</span>
                <span className="flex items-center text-green-600">
                  <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm md:text-base text-gray-600">Last Backup</span>
                <span className="text-sm text-gray-500">2 hours ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;