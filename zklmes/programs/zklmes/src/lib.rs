use anchor_lang::prelude::*;

declare_id!("5ZokR8MrcDgC1ZdfQokkLffPKPAEYN3ie2duefa5dZKv");

#[program]
pub mod zklmes {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
