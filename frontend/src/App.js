import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './layout/Layout';
import Dashboard from './pages/Dashboard';
import User from './pages/User';
import Gallery from './pages/Gallery';
import Branches from './pages/Branches';
import Production from './pages/Production';
import Operations from './pages/Operations';
import Analytics from './pages/Analytics';
import Costing from './pages/Costing';
import Procurements from './pages/Procurements';
import Reports from './pages/Reports';
import Inventory from './pages/Inventory';
import Suppliers from './pages/Suppliers';
import Packaging from './pages/Packaging';
import RecipeExperts from './pages/RecipeExperts';
import Departments from './pages/Departments';
import Items from './pages/Items';
import ItemCategory from './pages/ItemCategory';
import Units from './pages/Units';
import Roles from './pages/Roles';
import Brand from './pages/Brand';
import Currency from './pages/Currency';
import MenuItems from './pages/MenuItems';
import Tax from './pages/Tax';
import Login from './pages/Login';
import EditItem from './pages/EditItem';
import UserManagement from './pages/UserManagement';
import SubCategoryItems from './pages/SubCategoryItems';
import SubCategories from './pages/SubCategories';
import BranchOrders from './pages/BranchOrders';

// Import new Branch Order pages
import BranchOrderBranch from './pages/BranchOrder/Branch';
import BranchOrderCentralKitchen from './pages/BranchOrder/CentralKitchen';
import BranchOrderReports from './pages/BranchOrder/Reports';
import BranchOrderSettings from './pages/BranchOrder/Settings';
import CreateOrder from './pages/BranchOrder/CreateOrder';
import OrderSubmission from './pages/BranchOrder/OrderSubmission';
import OrderHistory from './pages/BranchOrder/OrderHistory';
import InventoryControl from './pages/BranchOrder/InventoryControl';

function App() {
  const menuItems = [
    {
      label: 'Dashboards',
      path: '/dashboard',
      icon: '📊',
    },
    {
      label: 'Branch Order',
      icon: '📦',
      children: [
        { 
          label: 'Branch', 
          path: '/branch-order/branch',
          children: [
            { label: 'Create Order', path: '/branch-order/create-order' },
            { label: 'Order Submission', path: '/branch-order/order-submission' },
            { label: 'Order History', path: '/branch-order/order-history' },
            { label: 'Inventory Control', path: '/branch-order/inventory-control' },
          ]
        },
        { label: 'Central Kitchen', path: '/branch-order/central-kitchen' },
        { label: 'Reports and Analysis', path: '/branch-order/reports' },
        { label: 'Settings', path: '/branch-order/settings' },
      ],
    },
    {
      label: 'Settings',
      icon: '⚙️',
      children: [
        { label: 'User Management', path: '/user-management' },
        { label: 'User', path: '/user' },
        { label: 'Gallery', path: '/gallery' },
        { label: 'Roles', path: '/roles' },
        { label: 'Units', path: '/units' },
        { label: 'Menu Category', path: '/menu' },
        { label: 'Item Category', path: '/item-category' },
        { label: 'Sub Categories', path: '/sub-categories' },
        { label: 'Departments', path: '/departments' },
        { label: 'Tax', path: '/tax' },
        { label: 'Branches', path: '/branches' },
        { label: 'Brand', path: '/brand' },
        { label: 'Currency', path: '/currency' },
      ],
    },
    {
      label: 'Create',
      icon: '➕',
      children: [
        { label: 'Items', path: '/items' },
        { label: 'Recipe Experts', path: '/recipe-experts' },
        { label: 'Suppliers', path: '/suppliers' },
        { label: 'Packaging', path: '/packaging' },
      ],
    },
    {
      label: 'Inventory',
      path: '/inventory',
      icon: '📦',
    },
    {
      label: 'Reports',
      path: '/reports',
      icon: '📊',
    },
    {
      label: 'Procurements',
      path: '/procurements',
      icon: '🛒',
    },
    {
      label: 'Costing',
      path: '/costing',
      icon: '💰',
    },
    {
      label: 'Analytics',
      path: '/analytics',
      icon: '📈',
    },
    {
      label: 'Operations',
      path: '/operations',
      icon: '⚙️',
    },
    {
      label: 'Production',
      path: '/production',
      icon: '🏭',
    },
  ];

  return (
    <AuthProvider>
     <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/" element={<Login />} />

        {/* Protected Routes with Layout */}
        <Route
          path="/*"
          element={
              <ProtectedRoute>
            <Layout menuItems={menuItems}>
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/user-management" element={<UserManagement />} />
                <Route path="/user" element={<User />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/roles" element={<Roles />} />
                <Route path="/units" element={<Units />} />
                <Route path="/item-category" element={<ItemCategory />} />
                <Route path="/items" element={<Items />} />
                <Route path="/departments" element={<Departments />} />
                <Route path="/recipe-experts" element={<RecipeExperts />} />
                <Route path="/suppliers" element={<Suppliers />} />
                <Route path="/packaging" element={<Packaging />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/procurements" element={<Procurements />} />
                <Route path="/costing" element={<Costing />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/operations" element={<Operations />} />
                <Route path="/production" element={<Production />} />
                <Route path="/branches" element={<Branches />} />
                <Route path="/brand" element={<Brand />} />
                <Route path="/currency" element={<Currency />} />
                <Route path="/menu" element={<MenuItems />} />
                <Route path="/tax" element={<Tax />} />
                <Route path="/items/:id/edit" element={<EditItem />} />
                <Route path="/sub-category-items" element={<SubCategoryItems />} />
                <Route path="/sub-categories" element={<SubCategories />} />
                <Route path="/branch-orders" element={<BranchOrders />} />
                
                {/* Branch Order Routes */}
                <Route path="/branch-order/branch" element={<BranchOrderBranch />} />
                <Route path="/branch-order/central-kitchen" element={<BranchOrderCentralKitchen />} />
                <Route path="/branch-order/reports" element={<BranchOrderReports />} />
                <Route path="/branch-order/settings" element={<BranchOrderSettings />} />
                <Route path="/branch-order/create-order" element={<CreateOrder />} />
                <Route path="/branch-order/order-submission" element={<OrderSubmission />} />
                <Route path="/branch-order/order-history" element={<OrderHistory />} />
                <Route path="/branch-order/inventory-control" element={<InventoryControl />} />
              </Routes>
            </Layout>
              </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
    </AuthProvider>
  );
}

export default App;