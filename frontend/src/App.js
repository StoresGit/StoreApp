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
import Sections from './pages/Sections';

// Import new category pages
import PurchaseCategory from './pages/PurchaseCategory';
import MenuCategory from './pages/MenuCategory';
import BranchCategory from './pages/BranchCategory';

// Import new Branch Order pages
import Branch from './pages/BranchOrder/Branch';
import BranchOrderCentralKitchen from './pages/BranchOrder/CentralKitchen';
import BranchOrderReports from './pages/BranchOrder/Reports';
import BranchOrderSettings from './pages/BranchOrder/Settings';
import CreateOrder from './pages/BranchOrder/CreateOrder';
import OrderSubmission from './pages/BranchOrder/OrderSubmission';
import OrderHistoryTracking from './pages/BranchOrder/OrderHistoryTracking';
import InventoryControl from './pages/BranchOrder/InventoryControl';
import ReceivingOrder from './pages/BranchOrder/ReceivingOrder';
import StockCount from './pages/BranchOrder/StockCount';
import Wastage from './pages/BranchOrder/Wastage';

// Import Central Kitchen pages
import CentralKitchenDashboard from './pages/CentralKitchen/Dashboard';
import BranchOrdersHistory from './pages/CentralKitchen/BranchOrdersHistory';
import PickList from './pages/CentralKitchen/PickList';
import OrderProcessingPrep from './pages/CentralKitchen/OrderProcessingPrep';

// Import new Branch Settings pages
import CreateItem from './pages/BranchSettings/CreateItem';
import CreateCategory from './pages/BranchSettings/CreateCategory';
import BranchUnits from './pages/BranchSettings/BranchUnits';
import BranchUsers from './pages/BranchSettings/BranchUsers';
import BranchSection from './pages/BranchSettings/BranchSection';

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
          children: [
            { label: 'Create Order', path: '/branch-order/create-order' },
            { label: 'Order Submission', path: '/branch-order/order-submission' },
            { label: 'Order History & Tracking', path: '/branch-order/order-history' },
            { 
              label: 'Inventory Control', 
              children: [
                { label: 'Receiving Order', path: '/branch-order/receiving-order' },
                { label: 'Stock Count', path: '/branch-order/stock-count' },
                { label: 'Wastage', path: '/branch-order/wastage' },
              ]
            },
          ]
        },
        { 
          label: 'Central Kitchen', 
          children: [
            { label: 'Dashboard', path: '/central-kitchen/dashboard' },
            { label: 'Branch Orders & History', path: '/central-kitchen/branch-orders-history' },
            { label: 'Pick List', path: '/central-kitchen/pick-list' },
            { label: 'Order Processing & Prep', path: '/central-kitchen/order-processing-prep' },
          ]
        },
        { 
          label: 'Reports & Analytics', 
          children: [
            { label: 'Order Patterns', path: '/reports/order-patterns' },
            { label: 'Missing Item Analysis', path: '/reports/missing-item-analysis' },
            { label: 'Wastage Reports', path: '/reports/wastage-reports' },
          ]
        },
        { 
          label: 'Branch Settings', 
          children: [
            { label: 'Create Item', path: '/branch-settings/create-item' },
            { label: 'Create Category', path: '/branch-settings/create-category' },
            { label: 'Branch Units', path: '/branch-settings/branch-units' },
            { label: 'Branch Users', path: '/branch-settings/branch-users' },
            { label: 'Branch Section', path: '/branch-settings/branch-section' },
          ]
        },
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
        { label: 'Sub Categories', path: '/sub-categories' },
        { label: 'Departments', path: '/departments' },
        { label: 'Tax', path: '/tax' },
        { label: 'Branches', path: '/branches' },
        { label: 'Brand', path: '/brand' },
        { label: 'Currency', path: '/currency' },
        { label: 'Sections', path: '/sections' },
      ],
    },
    {
      label: 'Item Category',
      icon: '📂',
      children: [
        { label: 'Purchase Category', path: '/purchase-category' },
        { label: 'Menu Category', path: '/menu-category' },
        { label: 'Branch Category', path: '/branch-category' },
        { label: 'Sub Categories', path: '/sub-categories' },
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
                <Route path="/sections" element={<Sections />} />
                
                {/* New Category Routes */}
                <Route path="/purchase-category" element={<PurchaseCategory />} />
                <Route path="/menu-category" element={<MenuCategory />} />
                <Route path="/branch-category" element={<BranchCategory />} />
                
                {/* Branch Order Routes */}
                <Route path="/branch-order/branch" element={<Branch />} />
                <Route path="/branch-order/central-kitchen" element={<BranchOrderCentralKitchen />} />
                <Route path="/branch-order/reports" element={<BranchOrderReports />} />
                <Route path="/branch-order/settings" element={<BranchOrderSettings />} />
                <Route path="/branch-order/create-order" element={<CreateOrder />} />
                <Route path="/branch-order/order-submission" element={<OrderSubmission />} />
                <Route path="/branch-order/order-history" element={<OrderHistoryTracking />} />
                <Route path="/branch-order/inventory-control" element={<InventoryControl />} />
                <Route path="/branch-order/receiving-order" element={<ReceivingOrder />} />
                <Route path="/branch-order/stock-count" element={<StockCount />} />
                <Route path="/branch-order/wastage" element={<Wastage />} />
                
                {/* Central Kitchen Routes */}
                <Route path="/central-kitchen/dashboard" element={<CentralKitchenDashboard />} />
                <Route path="/central-kitchen/branch-orders-history" element={<BranchOrdersHistory />} />
                <Route path="/central-kitchen/pick-list" element={<PickList />} />
                <Route path="/central-kitchen/order-processing-prep" element={<OrderProcessingPrep />} />
                
                {/* Reports & Analytics Routes */}
                <Route path="/reports/order-patterns" element={<div className="p-6"><h1>Order Patterns</h1><p>Coming Soon...</p></div>} />
                <Route path="/reports/missing-item-analysis" element={<div className="p-6"><h1>Missing Item Analysis</h1><p>Coming Soon...</p></div>} />
                <Route path="/reports/wastage-reports" element={<div className="p-6"><h1>Wastage Reports</h1><p>Coming Soon...</p></div>} />
                
                {/* Branch Settings Routes */}
                <Route path="/branch-settings/create-item" element={<CreateItem />} />
                <Route path="/branch-settings/create-category" element={<CreateCategory />} />
                <Route path="/branch-settings/branch-units" element={<BranchUnits />} />
                <Route path="/branch-settings/branch-users" element={<BranchUsers />} />
                <Route path="/branch-settings/branch-section" element={<BranchSection />} />
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