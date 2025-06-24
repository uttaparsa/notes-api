describe('note - creation', () => {
  it('passes', () => {
    cy.visit('localhost:3000')

    // try logging in
    cy.get('input[id="username"]').type('admin')
    cy.get('input[id="password"]').type('cypruslimassol')
    cy.get('button[type="submit"]').click()


    //create the first note
    cy.get('button.btn-primary.shadow-lg').click()
    cy.get('textarea').type('This is a test note')
    cy.get('button[id="send-button"]').click()

    
    // delete the note
    cy.contains('.card', 'This is a test note')
    .within(() => {
      cy.get('button.dropdown-toggle').should('be.visible').click({ force: true });
      cy.wait(200); // Wait for dropdown to fully render
    });
    
    // Click delete outside the card context after dropdown opens
    cy.contains('Delete').should('be.visible').click();
    
    // confirm deletion in modal
    cy.get('button').contains('Delete').click();


  })


})