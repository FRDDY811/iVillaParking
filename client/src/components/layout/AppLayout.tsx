import React, { useCallback } from 'react'
import { Layout, Menu, Button, Typography, Avatar, Dropdown } from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  CarOutlined,
  TeamOutlined,
  TrophyOutlined,
  SettingOutlined,
  ImportOutlined,
  CameraOutlined,
  LogoutOutlined,
  UserOutlined,
  SearchOutlined
} from '@ant-design/icons'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../store'
import { toggleSidebar } from '../../store/uiSlice'
import { logout } from '../../store/authSlice'
import { useAuth } from '../../hooks/useAuth'
import { formatUserName } from '../../utils/formatters'
import { ROUTES } from '../../utils/routes'
import styles from './AppLayout.module.css'

const { Header, Sider, Content } = Layout
const { Text } = Typography

const logoCollapsedStyle = { fontSize: 14 }
const logoExpandedStyle = { fontSize: 18 }

const adminMenuItems = [
  { key: ROUTES.ADMIN, icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: ROUTES.ADMIN_RESIDENTS, icon: <TeamOutlined />, label: 'Residents' },
  { key: ROUTES.ADMIN_PARKING, icon: <CarOutlined />, label: 'Parking Config' },
  { key: ROUTES.ADMIN_RAFFLE, icon: <TrophyOutlined />, label: 'Raffle' },
  { key: ROUTES.ADMIN_SEARCH, icon: <SearchOutlined />, label: 'Plate Search' },
  { key: ROUTES.ADMIN_IMPORT_EXPORT, icon: <ImportOutlined />, label: 'Import/Export' },
  { key: ROUTES.ADMIN_CAMERA, icon: <CameraOutlined />, label: 'Camera' }
]

const residentMenuItems = [
  { key: ROUTES.RESIDENT, icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: ROUTES.RESIDENT_VEHICLES, icon: <CarOutlined />, label: 'My Vehicles' },
  { key: ROUTES.RESIDENT_RAFFLE, icon: <TrophyOutlined />, label: 'Raffle' },
  { key: ROUTES.RESIDENT_HISTORY, icon: <SettingOutlined />, label: 'History' }
]

/** Main application shell with responsive sidebar navigation, header with user info,
 * and role-based in menu items (admin vs. resident).
 **/
const AppLayout: React.FC = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { sidebarCollapsed } = useAppSelector(state => state.ui)
  const { user, isAdmin } = useAuth()

  const handleLogout = useCallback(() => {
    dispatch(logout()).then(() => navigate(ROUTES.LOGIN))
  }, [dispatch, navigate])

  const menuItems = isAdmin ? adminMenuItems : residentMenuItems

  const userMenuItems = [
    { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', onClick: handleLogout }
  ]

  return (
    <Layout className={styles.layout}>
      <Sider trigger={null} collapsible collapsed={sidebarCollapsed} theme="dark">
        <div
          className={`${styles.logo} clickable-card`}
          style={sidebarCollapsed ? logoCollapsedStyle : logoExpandedStyle}
          onClick={() => navigate(isAdmin ? ROUTES.ADMIN : ROUTES.RESIDENT)}
        >
          {sidebarCollapsed ? 'iVP' : 'iVillaParking'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header className={styles.header}>
          <Button
            type="text"
            icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => dispatch(toggleSidebar())}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          />
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Button type="text" className={styles.userDropdown} aria-label="User menu">
              <Avatar icon={<UserOutlined />} />
              <Text>{formatUserName(user)}</Text>
            </Button>
          </Dropdown>
        </Header>
        <Content className={styles.content}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default AppLayout
