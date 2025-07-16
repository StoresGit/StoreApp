import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from "../assets/desktop-logo.png";
import logo1 from "../assets/toggle-logo.png";

// Sidebar Item Component
const SidebarItem = ({ item, isActive, onSubMenuToggle, isCollapsed, isSubMenuOpen, isMobile, level = 0, openSubMenus }) => {
    const location = useLocation();
    const hasChildren = Array.isArray(item.children) && item.children.length > 0;

    const toggleSubMenu = (e) => {
        e.preventDefault();
        if (hasChildren) {
            onSubMenuToggle(item.label);
        }
    };

    const isChildActive = (child) => {
        if (child.path) {
            return location.pathname === child.path;
        }
        if (child.children) {
            return child.children.some(grandChild => location.pathname === grandChild.path);
        }
        return false;
    };

    // Different styling based on level
    const getItemStyles = () => {
        if (level === 0) {
            // Main menu items
            return {
                paddingLeft: '12px',
                fontWeight: '600',
                fontSize: '0.875rem',
                color: isActive ? '#735dff' : '#374151'
            };
        } else if (level === 1) {
            // First level sub-items
            return {
                paddingLeft: '28px',
                fontWeight: '500',
                fontSize: '0.8rem',
                color: isActive ? '#735dff' : '#6b7280'
            };
        } else {
            // Second level sub-items (nested)
            return {
                paddingLeft: '44px',
                fontWeight: '400',
                fontSize: '0.75rem',
                color: isActive ? '#735dff' : '#9ca3af'
            };
        }
    };

    const itemStyles = getItemStyles();

    return (
        <li className="mb-1">
            {item.path && !hasChildren ? (
                <Link
                    to={item.path}
                    className={`flex items-center p-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 ${
                        isActive ? 'text-[#735dff] bg-gray-100 font-semibold' : 'text-gray-700'
                    } ${isCollapsed && !isMobile ? 'justify-center' : ''}`}
                    style={{ 
                        paddingLeft: itemStyles.paddingLeft,
                        fontWeight: itemStyles.fontWeight,
                        fontSize: itemStyles.fontSize,
                        color: itemStyles.color
                    }}
                >
                    {item.icon && level === 0 && <span className={`${isCollapsed && !isMobile ? 'mx-auto' : 'mr-3'} text-lg`}>{item.icon}</span>}
                    {level > 0 && <span className="mr-2 text-xs">•</span>}
                    {(!isCollapsed || isMobile) && <span>{item.label}</span>}
                </Link>
            ) : (
                <div>
                    <button
                        onClick={toggleSubMenu}
                        className={`w-full flex items-center p-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 ${
                            isActive ? 'text-[#735dff] bg-gray-100 font-semibold' : 'text-gray-700'
                        } ${isCollapsed && !isMobile ? 'justify-center' : 'justify-between'}`}
                        style={{ 
                            paddingLeft: itemStyles.paddingLeft,
                            fontWeight: itemStyles.fontWeight,
                            fontSize: itemStyles.fontSize,
                            color: itemStyles.color
                        }}
                    >
                        <div className="flex items-center">
                            {item.icon && level === 0 && <span className={`${isCollapsed && !isMobile ? 'mx-auto' : 'mr-3'} text-lg`}>{item.icon}</span>}
                            {level > 0 && <span className="mr-2 text-xs">•</span>}
                            {(!isCollapsed || isMobile) && <span>{item.label}</span>}
                        </div>
                        {(!isCollapsed || isMobile) && hasChildren && (
                            <svg
                                className={`w-4 h-4 transition-transform duration-200 ${isSubMenuOpen ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        )}
                    </button>
                    {isSubMenuOpen && (!isCollapsed || isMobile) && (
                        <ul className="mt-1 space-y-1">
                            {item.children.map(child => (
                                <SidebarItem
                                    key={child.label}
                                    item={child}
                                    isActive={isChildActive(child)}
                                    onSubMenuToggle={onSubMenuToggle}
                                    isCollapsed={isCollapsed}
                                    isSubMenuOpen={openSubMenus[child.label] || false}
                                    isMobile={isMobile}
                                    level={level + 1}
                                    openSubMenus={openSubMenus}
                                />
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </li>
    );
};

// Sidebar Component
const Sidebar = ({ menuItems, isCollapsed, isMobileMenuOpen, onCloseMobileMenu }) => {
    const location = useLocation();
    const [openSubMenus, setOpenSubMenus] = useState({});
    const [isMobile, setIsMobile] = useState(false);

    // Check if we're on mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleSubMenuToggle = (label) => {
        setOpenSubMenus(prev => ({
            ...prev,
            [label]: !prev[label]
        }));
    };

    const isMenuItemActive = (item) => {
        if (item.path) {
            return location.pathname === item.path;
        }
        if (item.children) {
            return item.children.some(child => {
                if (child.path) {
                    return location.pathname === child.path;
                }
                if (child.children) {
                    return child.children.some(grandChild => location.pathname === grandChild.path);
                }
                return false;
            });
        }
        return false;
    };

    const sidebarClasses = `
        bg-white shadow-lg flex-shrink-0 transition-all duration-300 ease-in-out
        ${isMobile ? 
            `fixed top-0 left-0 h-full z-50 w-64 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}` :
            `sticky top-0 h-screen ${isCollapsed ? 'w-16' : 'w-64'}`
        }
    `;

    return (
        <>
            {/* Mobile overlay */}
            {isMobile && isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40"
                    onClick={onCloseMobileMenu}
                />
            )}
            
            <div className={sidebarClasses}>
                <div className="flex items-center justify-center h-16 border-b border-gray-200">
                    <img
                        src={isCollapsed && !isMobile ? logo1 : logo}
                        alt="logo"
                        className={`${isCollapsed && !isMobile ? 'w-8' : 'w-24 md:w-32'} transition-all duration-300`}
                    />
                </div>
                <div
                    className="h-[calc(100vh-4rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                    style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#D1D5DB #F3F4F6',
                    }}
                >
                    <ul className="list-none p-3 space-y-1">
                        {menuItems.map(item => (
                            <SidebarItem
                                key={item.label}
                                item={item}
                                isActive={isMenuItemActive(item)}
                                onSubMenuToggle={handleSubMenuToggle}
                                isCollapsed={isCollapsed}
                                isSubMenuOpen={openSubMenus[item.label] || false}
                                isMobile={isMobile}
                                openSubMenus={openSubMenus}
                            />
                        ))}
                    </ul>
                </div>
            </div>
        </>
    );
};

// Header Component
const Header = ({ onMenuToggle, isSidebarCollapsed, onMobileMenuToggle }) => {
    const { user, logout, isMasterAdmin } = useAuth();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleLogout = async () => {
        await logout();
    };

    const handleMenuToggle = () => {
        if (isMobile) {
            onMobileMenuToggle();
        } else {
            onMenuToggle();
        }
    };

    return (
        <div className="bg-white shadow-md flex items-center justify-between h-16 px-4 sticky top-0 z-30">
            <div className="flex items-center">
                <button
                    className="text-gray-500 focus:outline-none mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    onClick={handleMenuToggle}
                >
                    <svg
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                <div className="text-sm text-gray-600 hidden sm:block">
                    <span>Dashboard</span>
                </div>
            </div>
            
            <div className="flex items-center gap-2 md:gap-4">
                {/* Desktop User Info */}
                <div className="hidden md:block text-right">
                    <div className="text-sm font-medium text-gray-700">{user?.name || 'User'}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1 justify-end">
                        <span className="capitalize">{user?.role || 'user'}</span>
                        {isMasterAdmin() && <span className="text-blue-600">👑</span>}
                    </div>
                </div>
                
                {/* Mobile User Menu */}
                <div className="md:hidden relative">
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                                {user?.name?.charAt(0) || 'U'}
                            </span>
                        </div>
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    
                    {showUserMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                            <div className="px-4 py-2 border-b border-gray-200">
                                <div className="text-sm font-medium text-gray-700">{user?.name || 'User'}</div>
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                    <span className="capitalize">{user?.role || 'user'}</span>
                                    {isMasterAdmin() && <span className="text-blue-600">👑</span>}
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    )}
                </div>
                
                {/* Desktop Logout Button */}
                <button
                    className="hidden md:block bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors text-sm"
                    onClick={handleLogout}
                >
                    Logout
                </button>
            </div>
        </div>
    );
};

// Layout Component
function Layout({ children, menuItems }) {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleMenuToggle = () => {
        setIsSidebarCollapsed(prev => !prev);
    };

    const handleMobileMenuToggle = () => {
        setIsMobileMenuOpen(prev => !prev);
    };

    const handleCloseMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    // Close mobile menu when screen size changes to desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setIsMobileMenuOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar 
                menuItems={menuItems} 
                isCollapsed={isSidebarCollapsed} 
                isMobileMenuOpen={isMobileMenuOpen}
                onCloseMobileMenu={handleCloseMobileMenu}
            />
            <div className="flex flex-col flex-1 min-w-0">
                <Header 
                    onMenuToggle={handleMenuToggle} 
                    isSidebarCollapsed={isSidebarCollapsed}
                    onMobileMenuToggle={handleMobileMenuToggle}
                />
                <main className="flex-1 bg-gray-100 p-3 md:p-6 overflow-y-auto">
                    <div className="max-w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

export default Layout;