import PrivacyAndPolicy from "@/components/privacy-policy";

const PrivacyAndPolicyPage = () => {
    return ( 
        <div className="flex flex-col items-center justify-center p-8">
            <div className="text-5xl font-black mt-20">
                Privacy Policy
            </div>
            <PrivacyAndPolicy />
        </div>
     );
}
 
export default PrivacyAndPolicyPage;