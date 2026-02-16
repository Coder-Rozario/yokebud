import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';
import Home from './pages/Home';
import About from './pages/About';
import Clothing from './pages/Clothing';
import OtherProducts from './pages/OtherProducts';
import Contact from './pages/Contact';
import AdminLogin from './pages/admin/AdminLogin';
import AdminPanel from './pages/admin/AdminPanel';
import AdminProducts from './pages/admin/AdminProducts';
import './pages/styles/main.min.css';
import ProtectedRoute from './components/ProtectedRoute';
import Signup from './components/Signup';
import Login from './components/Login';
import CartPage from './pages/CartPage';
import UserProfile from './components/UserProfile';
import PolicyPage from './components/PolicyPage';
import Return from './components/Return';
import Shipping from './components/Shipping';
import Loading from './components/Loading';
import AdminEdit from './pages/admin/AdminEdit';
import AdminChangePassword from './pages/admin/AdminChangePassword';
import AdminMessages from './pages/admin/AdminMessages';
import AdminSettings from './pages/admin/AdminSettings ';
import AdminUpload from './pages/admin/AdminUpload ';
import ProductModal from './components/ProductModal';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import Checkout from './components/Checkout';
import Inquiry from './components/Inquiry';
import AdminInquiry from './pages/admin/AdminInquiry';
import MessagesPage from './components/MessagesPage';
import UnsubscribePage from './components/UnsubscribePage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/loading" element={<Loading />} />
        
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="/" element={<Home />} />
          <Route path="MessagesPage" element={<MessagesPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/UnsubscribePage" element={<UnsubscribePage />} />
          <Route path="/Inquiry" element={<Inquiry />} />
          <Route path="/Checkout" element={<Checkout />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/UserProfile" element={<UserProfile />} />
          <Route path="/about" element={<About />} />
          <Route path="/clothing" element={<Clothing />} />
          <Route path="/other-products" element={<OtherProducts />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/policy" element={<PolicyPage />} />
          <Route path="/return" element={<Return />} />
          <Route path="/shipping" element={<Shipping />} />
          <Route path="/products/:id" element={<ProductModal />} />
<Route path="/products/:productId" element={<ProductModal />} />

        </Route>

        {/* Admin login */}
        <Route path="/admin/login" element={<AdminLogin />} />
        
        {/* Admin Routes */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminPanel />} />
          <Route path="dashboard" element={<AdminPanel />} />
          <Route path="AdminInquiry" element={<AdminInquiry />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="upload" element={<AdminUpload />} />
          <Route path="products/edit/:id" element={<AdminEdit />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="messages/:id" element={<AdminMessages />} />
          <Route path="change_password" element={<AdminChangePassword />} />
        </Route>

        {/* 404 Page */}
        <Route path="*" element={<div>Page Not Found</div>} />
      </Routes>
    </Router>
  );
}

export default App;
