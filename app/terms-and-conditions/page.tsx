import TermsAndConditionTypeWriting from "@/components/typewriting/terms-and-conditions-typewriting";

const TermsAndConditionPage = () => {
    return ( 
        <div className="flex flex-col items-center justify-center p-8">
            <div className="text-5xl font-black">
                Terms and Conditions
            </div>
            <TermsAndConditionTypeWriting />
        </div>
     );
}
 
export default TermsAndConditionPage;