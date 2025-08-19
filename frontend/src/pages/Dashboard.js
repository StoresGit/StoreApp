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
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <p className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{value}</p>
          {trend && (
            <div className="flex items-center">
              <span className={`text-sm font-medium ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.positive ? '↗' : '↘'} {trend.value}%
              </span>
              <span className="text-xs text-gray-500 ml-2">vs last period</span>
            </div>
          )}
        </div>
        <div className={`p-4 rounded-2xl ${color} shadow-lg`}>
          <span className="text-2xl md:text-3xl">{icon}</span>
        </div>
      </div>
    </div>
  );

  const ActivityCard = () => (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
        <svg className="w-6 h-6 mr-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
        Recent Activity
      </h3>
      <div className="space-y-4">
        {stats.recentActivity.map((activity) => (
          <div key={activity.id} className="flex items-center space-x-4 p-3 rounded-xl hover:bg-gray-50 transition-colors duration-200">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white text-sm">📝</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{activity.action}</p>
              <p className="text-xs text-gray-500">by {activity.user}</p>
            </div>
            <span className="text-xs text-gray-400 whitespace-nowrap bg-gray-100 px-2 py-1 rounded-full">{activity.time}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const LowStockCard = () => (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
        <svg className="w-6 h-6 mr-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        Low Stock Alert
      </h3>
      <div className="space-y-4">
        {stats.lowStock.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-200">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">{item.name}</p>
              <p className="text-xs text-gray-500">Min: {item.minStock} units</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-red-600">{item.stock}</p>
              <p className="text-xs text-gray-500">in stock</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const QuickActions = () => (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
        <svg className="w-6 h-6 mr-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        Quick Actions
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <button className="flex flex-col items-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all duration-300 transform hover:scale-105 shadow-lg">
          <span className="text-3xl mb-2">📦</span>
          <span className="text-sm font-semibold text-gray-700">Add Item</span>
        </button>
        <button className="flex flex-col items-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl hover:from-green-100 hover:to-green-200 transition-all duration-300 transform hover:scale-105 shadow-lg">
          <span className="text-3xl mb-2">👥</span>
          <span className="text-sm font-semibold text-gray-700">Add User</span>
        </button>
        <button className="flex flex-col items-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl hover:from-purple-100 hover:to-purple-200 transition-all duration-300 transform hover:scale-105 shadow-lg">
          <span className="text-3xl mb-2">🏢</span>
          <span className="text-sm font-semibold text-gray-700">Add Branch</span>
        </button>
        <button className="flex flex-col items-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl hover:from-orange-100 hover:to-orange-200 transition-all duration-300 transform hover:scale-105 shadow-lg">
          <span className="text-3xl mb-2">📊</span>
          <span className="text-sm font-semibold text-gray-700">View Reports</span>
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 flex items-center">
                  <svg className="w-10 h-10 mr-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  Welcome back, {user?.name || 'User'}!
                </h1>
                <p className="text-blue-100 text-lg">
                  Here's what's happening with your business today.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedTimeRange}
                  onChange={(e) => setSelectedTimeRange(e.target.value)}
                  className="px-4 py-2 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 text-sm font-medium bg-white/10 text-white backdrop-blur-sm"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                </select>
              </div>
            </div>
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Takes 2/3 on desktop */}
        <div className="lg:col-span-2 space-y-8">
          <ActivityCard />
          
          {/* Chart Placeholder */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <svg className="w-6 h-6 mr-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Sales Overview
            </h3>
            <div className="h-80 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl flex items-center justify-center border-2 border-dashed border-blue-200">
              <div className="text-center">
                <span className="text-6xl mb-4 block">📈</span>
                <p className="text-lg text-gray-600 font-medium">Chart visualization coming soon</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Takes 1/3 on desktop */}
        <div className="space-y-8">
          <QuickActions />
          <LowStockCard />
          
          {/* System Status */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <svg className="w-6 h-6 mr-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              System Status
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-200">
                <span className="text-sm font-medium text-gray-700">Server Status</span>
                <span className="flex items-center text-green-600 font-semibold">
                  <div className="w-3 h-3 bg-green-600 rounded-full mr-2 animate-pulse"></div>
                  Online
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-200">
                <span className="text-sm font-medium text-gray-700">Database</span>
                <span className="flex items-center text-green-600 font-semibold">
                  <div className="w-3 h-3 bg-green-600 rounded-full mr-2"></div>
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200">
                <span className="text-sm font-medium text-gray-700">Last Backup</span>
                <span className="text-sm text-gray-600 font-medium">2 hours ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
        </div>
      </div>
  );
};

export default Dashboard;