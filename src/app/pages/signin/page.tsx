// import AuthForm from '../../components/Authform';

// export default function Signin() {
//   return (
//     <div className="container mx-auto p-4">
//       <h1 className="text-2xl font-bold mb-4">Sign In</h1>
//       <AuthForm type="signin" />
//       <p className="mt-2">
//         Forgot your password?{' '}
//         <a href="/forgot-password" className="text-blue-600 hover:underline">
//           Reset it here
//         </a>
//       </p>
//     </div>
//   );
// }

import AuthForm from '../../components/Authform';

import Navbar from '../../components/Navbar';

export default function Signup() {
  return (
    <div className="">
      <AuthForm type="signin" />
    </div>
  );
}