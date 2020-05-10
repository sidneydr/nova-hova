public with sharing class LWCDataTableController {

    /*
    @AuraEnabled(cacheable=true)
    public static List<Contact> getContactList() {
        return [
            SELECT Id, FirstName, LastName, Title, Phone, Email
            FROM Contact
            WITH SECURITY_ENFORCED
            LIMIT 10
        ];
    }
    */

    // RETRIEVE THE RELATED OPPORTUNITY LINES DATA
    @AuraEnabled(cacheable=true)
    public static list<OpportunityLine__c> getOppLines(string opptyId){
        List<OpportunityLine__c> lst = new List<OpportunityLine__c>([SELECT Id, Name, OpportunityId__c, Product__c, ProductName__c, ProductCode__c, ListPrice__c, SalesPrice__c, Quantity__c, Description__c, Discount__c, ServiceDate__c, DiscountAmount__c, LineTotal__c 
                                                                    FROM OpportunityLine__c 
                                                                    WHERE OpportunityId__c = :opptyId ]);
        return lst;
    }


   
}