import React, { Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './router/ProtectedRoute'
import PageLoader from './components/ui/PageLoader'
import { Toaster } from 'sonner'

const LoginPage = React.lazy(() => import('./features/auth/LoginPage'))
const RegisterPage = React.lazy(() => import('./features/auth/RegisterPage'))
const ForgotPasswordPage = React.lazy(() => import('./features/auth/ForgotPasswordPage'))
const ResetPasswordPage = React.lazy(() => import('./features/auth/ResetPasswordPage'))
const DashboardPage = React.lazy(() => import('./features/dashboard/DashboardPage'))
const InventoryPage = React.lazy(() => import('./features/inventory/InventoryPage'))
const ReceptionPage = React.lazy(() => import('./features/reception/ReceptionPage'))
const ReceptionOrderDetailPage = React.lazy(() => import('./features/reception/ReceptionOrderDetailPage'))
const DispatchPage = React.lazy(() => import('./features/dispatch/DispatchPage'))
const ReturnsPage = React.lazy(() => import('./features/returns/ReturnsPage'))
const AdjustmentsPage = React.lazy(() => import('./features/adjustments/AdjustmentsPage'))
const AlertsPage = React.lazy(() => import('./features/alerts/AlertsPage'))
const CatalogProductsPage = React.lazy(() => import('./features/catalog/CatalogProductsPage'))
const CatalogProductDetailPage = React.lazy(() => import('./features/catalog/CatalogProductDetailPage'))
const CatalogProductFormPage = React.lazy(() => import('./features/catalog/CatalogProductFormPage'))
const CatalogCategoriesPage = React.lazy(() => import('./features/catalog/CatalogCategoriesPage'))
const CatalogCategoryDetailPage = React.lazy(() => import('./features/catalog/CatalogCategoryDetailPage'))
const CatalogBrandsPage = React.lazy(() => import('./features/catalog/CatalogBrandsPage'))
const CatalogCombosPage = React.lazy(() => import('./features/catalog/CatalogCombosPage'))
const LocationsPage = React.lazy(() => import('./features/locations/LocationsPage'))
const TransfersPage = React.lazy(() => import('./features/locations/TransfersPage'))
const SuppliersPage = React.lazy(() => import('./features/purchasing/SuppliersPage'))
const SupplierDetailPage = React.lazy(() => import('./features/purchasing/SupplierDetailPage'))
const PurchaseOrdersPage = React.lazy(() => import('./features/purchasing/PurchaseOrdersPage'))
const AuditPage = React.lazy(() => import('./features/admin/AuditPage'))
const UsersPage = React.lazy(() => import('./features/admin/UsersPage'))
const HorariosPage = React.lazy(() => import('./features/admin/HorariosPage'))

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/inventory"
          element={
            <ProtectedRoute allowedRoles={['almacenista', 'administrador', 'auxiliar_despacho']}>
              <InventoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/reception"
          element={
            <ProtectedRoute allowedRoles={['almacenista', 'administrador']}>
              <ReceptionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/reception/:orderId"
          element={
            <ProtectedRoute allowedRoles={['almacenista', 'administrador']}>
              <ReceptionOrderDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/dispatch"
          element={
            <ProtectedRoute allowedRoles={['almacenista', 'administrador', 'auxiliar_despacho']}>
              <DispatchPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/returns"
          element={
            <ProtectedRoute allowedRoles={['almacenista', 'administrador', 'auxiliar_despacho']}>
              <ReturnsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/adjustments"
          element={
            <ProtectedRoute allowedRoles={['almacenista', 'administrador']}>
              <AdjustmentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/alerts"
          element={
            <ProtectedRoute allowedRoles={['almacenista', 'administrador', 'auxiliar_despacho']}>
              <AlertsPage />
            </ProtectedRoute>
          }
        />
        {/* Catalog Module */}
        <Route path="/app/catalog" element={<Navigate to="/app/catalog/products" replace />} />
        <Route
          path="/app/catalog/products"
          element={
            <ProtectedRoute allowedRoles={['almacenista', 'administrador', 'auxiliar_despacho']}>
              <CatalogProductsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/catalog/products/new"
          element={
            <ProtectedRoute allowedRoles={['almacenista', 'administrador']}>
              <CatalogProductFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/catalog/products/:id"
          element={
            <ProtectedRoute allowedRoles={['almacenista', 'administrador', 'auxiliar_despacho']}>
              <CatalogProductDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/catalog/products/:id/edit"
          element={
            <ProtectedRoute allowedRoles={['almacenista', 'administrador']}>
              <CatalogProductFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/catalog/categories"
          element={
            <ProtectedRoute allowedRoles={['almacenista', 'administrador', 'auxiliar_despacho']}>
              <CatalogCategoriesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/catalog/categories/:id"
          element={
            <ProtectedRoute allowedRoles={['almacenista', 'administrador', 'auxiliar_despacho']}>
              <CatalogCategoryDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/catalog/brands"
          element={
            <ProtectedRoute allowedRoles={['almacenista', 'administrador', 'auxiliar_despacho']}>
              <CatalogBrandsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/catalog/combos"
          element={
            <ProtectedRoute allowedRoles={['almacenista', 'administrador', 'auxiliar_despacho']}>
              <CatalogCombosPage />
            </ProtectedRoute>
          }
        />
        {/* Locations Module */}
        <Route
          path="/app/locations"
          element={
            <ProtectedRoute allowedRoles={['almacenista', 'administrador']}>
              <LocationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/locations/transfers"
          element={
            <ProtectedRoute allowedRoles={['almacenista', 'administrador']}>
              <TransfersPage />
            </ProtectedRoute>
          }
        />
        {/* Purchasing Module */}
        <Route
          path="/app/purchasing/suppliers"
          element={
            <ProtectedRoute allowedRoles={['almacenista', 'administrador', 'auxiliar_despacho']}>
              <SuppliersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/purchasing/suppliers/:id"
          element={
            <ProtectedRoute allowedRoles={['almacenista', 'administrador', 'auxiliar_despacho']}>
              <SupplierDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/purchasing/purchase-orders"
          element={
            <ProtectedRoute allowedRoles={['almacenista', 'administrador']}>
              <PurchaseOrdersPage />
            </ProtectedRoute>
          }
        />
        {/* Admin Module */}
        <Route
          path="/app/admin/audit"
          element={
            <ProtectedRoute allowedRoles={['almacenista', 'administrador']}>
              <AuditPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/admin/users"
          element={
            <ProtectedRoute allowedRoles={['almacenista', 'administrador']}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/admin/horarios"
          element={
            <ProtectedRoute>
              <HorariosPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <Toaster position="top-right" duration={3000} />
      </Suspense>
    </BrowserRouter>
  )
}

export default App
