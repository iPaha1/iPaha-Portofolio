// components/ToastifyProvider.tsx
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// const ToastifyProvider: React.FC = ({ children }) => {

const ToastifyProvider = () => {
  return (
    <>
      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      {/* {children} */}
    </>
  );
};

export default ToastifyProvider;
