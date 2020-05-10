public with sharing class OpportunityListController {

    public List<OpportunityLine__c> oppLineList {get;set;}
    public OpportunityListController(){
        this.oppLineList = new List<OpportunityLine__c>();
    }

    // RETRIEVE THE RELATED OPPORTUNITY LINES DATA
    @AuraEnabled(cacheable=true)
    public static list<OpportunityLine__c> getOppLines(string searchKey){
        List<OpportunityLine__c> lst = new List<OpportunityLine__c>([SELECT Id, Name, OpportunityId__c, Product__c, ProductName__c, ProductCode__c, ListPrice__c, SalesPrice__c, Quantity__c, Description__c, Discount__c, ServiceDate__c, DiscountAmount__c, LineTotal__c 
                                                                    FROM OpportunityLine__c 
                                                                    WHERE OpportunityId__c = :searchKey ]);
        return lst;
    }

    // CREATE INVOICE LINE RECORDS
    @AuraEnabled
    public static void createInvLines(list<Id> lstConIds, string invoiceId){
        if(lstConIds.size() > 0){
            List<OpportunityLine__c> oppLst = new List<OpportunityLine__c>([SELECT Id, Name, OpportunityId__c, Product__c, ProductCode__c, ListPrice__c, SalesPrice__c, Quantity__c, Description__c, Discount__c, ServiceDate__c, DiscountAmount__c, LineTotal__c 
                                                                        FROM OpportunityLine__c 
                                                                        WHERE Id = :lstConIds]);
            try {
                List<InvoiceLine__c> lstInvLinesToInsert = new List<InvoiceLine__c>();
                for(OpportunityLine__c idCon : oppLst) {
                    lstInvLinesToInsert.add(new InvoiceLine__c(InvoiceId__c = invoiceId,
                                                            Product__c = idCon.Product__c,
                                                            SalesPrice__c = idCon.SalesPrice__c,
                                                            Quantity__c = idCon.Quantity__c,
                                                            Description__c = idCon.Description__c,
                                                            Discount__c = idCon.Discount__c
                                                            ));
                }
                if(!lstInvLinesToInsert.isEmpty()) {
                    insert lstInvLinesToInsert;
                }
            }
            catch(Exception ex) {
                throw new AuraHandledException(ex.getMessage());
            }
        }
    }
    // Retrieves the Oppty's currency during connectedCallback (init)
    @AuraEnabled
    public static Opportunity__c getOppCurrency(string opptyId) {
        return [SELECT
                        Id,
                        CurrencyIsoCode
                FROM Opportunity__c
                WHERE Id =: opptyId][0];
    }

    @AuraEnabled(cacheable=true)
    public static list<OpportunityLine__c> getSumOppLines(string opptyId){
        List<OpportunityLine__c> lst = new List<OpportunityLine__c>([SELECT Id, OpportunityId__c, DiscountAmount__c, LineTotal__c 
                                                                    FROM OpportunityLine__c 
                                                                    WHERE OpportunityId__c = :opptyId ]);
        return lst;
    }

    @AuraEnabled
    public static Invoice__c getInvoiceName(string invoiceId){
        return [SELECT Id, Name
                FROM Invoice__c
                WHERE Id =: invoiceId][0];
    }

    /*
    @AuraEnabled        
    public static Decimal getDiscountAmount(string opptyId){      

        AggregateResult[] groupedResults = [SELECT Id, SUM(DiscountAmount__c)amt FROM OpportunityLine__c WHERE Id =: opptyId GROUP BY Id];
        Decimal sum = (Decimal)groupedResults[0].get('amt');
        return sum;
    }
    */
    /*
    @AuraEnabled
    public static Invoice__c getInvoiceName(string invId){
        return [SELECT Id, Name FROM Invoice__c WHERE Id =: invId LIMIT 1];
                
    }
    
    @AuraEnabled(cacheable=true)
    public static List<AggregateResult> getAggrOppLines(string opptyId){
        List<AggregateResult> AggregateResultList = [SELECT Id, Sum(DiscountAmount__c)amt1, Sum(LineTotal__c)amt2 
                                                    FROM OpportunityLine__c 
                                                    WHERE Id =: opptyId 
                                                    GROUP BY Id];
        return AggregateResultList;
    }
    
    
    public class wrapperClass{
        Integer intt;
        String strr;
        Account accc;
    }

    public static wrapperClass methodToReturnWrapper(){

        wrapperClass wc = new wrapperClass();
        //here you can fill in wrapper with values you want, like wc.int = 1
        return wc;
    }
    */
}