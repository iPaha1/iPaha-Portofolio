import PrivacyAndPolicyTypeWriting from "@/components/typewriting/privacy-and-policy-typewriting";

const PrivacyAndPolicyPage = () => {
    return ( 
        <div className="flex flex-col items-center justify-center p-8">
            <div className="text-5xl font-black">
                Privacy Policy
            </div>
            <PrivacyAndPolicyTypeWriting />
        </div>
     );
}
 
export default PrivacyAndPolicyPage;