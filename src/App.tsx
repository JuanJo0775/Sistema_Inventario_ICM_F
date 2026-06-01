import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './features/auth/LoginPage'
import RegisterPage from './features/auth/RegisterPage'
import ForgotPasswordPage from './features/auth/ForgotPasswordPage'
import DashboardPage from './features/dashboard/DashboardPage'
import InventoryPage from './features/inventory/InventoryPage'
import ReceptionPage from './features/reception/ReceptionPage'
import DispatchPage from './features/dispatch/DispatchPage'
import ReturnsPage from './features/returns/ReturnsPage'
import AdjustmentsPage from './features/adjustments/AdjustmentsPage'
import AlertsPage from './features/alerts/AlertsPage'
import ProtectedRoute from './router/ProtectedRoute'
import CatalogProductsPage from './features/catalog/CatalogProductsPage'
import CatalogProductDetailPage from './features/catalog/CatalogProductDetailPage'
import CatalogProductFormPage from './features/catalog/CatalogProductFormPage'
import CatalogCategoriesPage from './features/catalog/CatalogCategoriesPage'
import CatalogBrandsPage from './features/catalog/CatalogBrandsPage'
import LocationsPage from './features/locations/LocationsPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
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
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
