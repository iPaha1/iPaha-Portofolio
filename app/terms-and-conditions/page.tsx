import TermsAndCondition from "@/components/terms-and-conditions";

const TermsAndConditionPage = () => {
    return ( 
        <div className="flex flex-col items-center justify-center p-8">
            <div className="text-5xl font-black mt-20">
                Terms and Conditions
            </div>
            <TermsAndCondition />
        </div>
     );
}
 
export default TermsAndConditionPage;