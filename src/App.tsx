import React, { Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './router/ProtectedRoute'
import PageLoader from './components/ui/PageLoader'

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
            <ProtectedRoute>
              <InventoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/reception"
          element={
            <ProtectedRoute>
              <ReceptionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/reception/:orderId"
          element={
            <ProtectedRoute>
              <ReceptionOrderDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/dispatch"
          element={
            <ProtectedRoute>
              <DispatchPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/returns"
          element={
            <ProtectedRoute>
              <ReturnsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/adjustments"
          element={
            <ProtectedRoute>
              <AdjustmentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/alerts"
          element={
            <ProtectedRoute>
              <AlertsPage />
            </ProtectedRoute>
          }
        />
        {/* Catalog Module */}
        <Route path="/app/catalog" element={<Navigate to="/app/catalog/products" replace />} />
        <Route
          path="/app/catalog/products"
          element={
            <ProtectedRoute>
              <CatalogProductsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/catalog/products/new"
          element={
            <ProtectedRoute>
              <CatalogProductFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/catalog/products/:id"
          element={
            <ProtectedRoute>
              <CatalogProductDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/catalog/products/:id/edit"
          element={
            <ProtectedRoute>
              <CatalogProductFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/catalog/categories"
          element={
            <ProtectedRoute>
              <CatalogCategoriesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/catalog/categories/:id"
          element={
            <ProtectedRoute>
              <CatalogCategoryDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/catalog/brands"
          element={
            <ProtectedRoute>
              <CatalogBrandsPage />
            </ProtectedRoute>
          }
        />
        {/* Locations Module */}
        <Route
          path="/app/locations"
          element={
            <ProtectedRoute>
              <LocationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/locations/transfers"
          element={
            <ProtectedRoute>
              <TransfersPage />
            </ProtectedRoute>
          }
        />
        {/* Purchasing Module */}
        <Route
          path="/app/purchasing/suppliers"
          element={
            <ProtectedRoute>
              <SuppliersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/purchasing/suppliers/:id"
          element={
            <ProtectedRoute>
              <SupplierDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/purchasing/purchase-orders"
          element={
            <ProtectedRoute>
              <PurchaseOrdersPage />
            </ProtectedRoute>
          }
        />
        {/* Admin Module */}
        <Route
          path="/app/admin/audit"
          element={
            <ProtectedRoute>
              <AuditPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/admin/users"
          element={
            <ProtectedRoute>
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
      </Suspense>
    </BrowserRouter>
  )
}

export default App
