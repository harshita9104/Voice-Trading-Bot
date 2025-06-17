const localtunnel = require('localtunnel');
const fs = require('fs');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

async function startTunnel() {
  console.log('Starting localtunnel...');
  
  try {
    // Try with a random subdomain first
    const tunnel = await localtunnel({ port: PORT });
    
    console.log(`✅ Tunnel established! Your public URL is: ${tunnel.url}`);
    console.log('Copy this URL and update your .env file with:');
    console.log(`BASE_URL=${tunnel.url}`);
    
    // Update .env file automatically
    try {
      let envContent = '';
      if (fs.existsSync('.env')) {
        envContent = fs.readFileSync('.env', 'utf8');
      }
      
      // Replace or add BASE_URL
      if (envContent.includes('BASE_URL=')) {
        envContent = envContent.replace(/BASE_URL=.*/g, `BASE_URL=${tunnel.url}`);
      } else {
        envContent += `\nBASE_URL=${tunnel.url}`;
      }
      
      fs.writeFileSync('.env', envContent);
      console.log('✅ .env file updated automatically!');
    } catch (err) {
      console.log('Could not update .env file automatically:', err.message);
    }
    
    tunnel.on('close', () => {
      console.log('Tunnel closed');
      // Try to restart after a delay
      setTimeout(startTunnel, 5000);
    });
    
    tunnel.on('error', (err) => {
      console.log('Tunnel error:', err);
      tunnel.close();
    });
    
  } catch (error) {
    console.error('Failed to establish tunnel:', error.message);
    console.log('Trying alternative approach...');
    
    // Try with specific subdomain as fallback
    try {
      const subdomain = 'voice-trading-bot-' + Math.floor(Math.random() * 10000);
      const tunnel = await localtunnel({ 
        port: PORT,
        subdomain: subdomain
      });
      
      console.log(`✅ Tunnel established with custom subdomain! Your public URL is: ${tunnel.url}`);
      console.log('Copy this URL and update your .env file with:');
      console.log(`BASE_URL=${tunnel.url}`);
      
      // Update .env file automatically
      try {
        let envContent = '';
        if (fs.existsSync('.env')) {
          envContent = fs.readFileSync('.env', 'utf8');
        }
        
        // Replace or add BASE_URL
        if (envContent.includes('BASE_URL=')) {
          envContent = envContent.replace(/BASE_URL=.*/g, `BASE_URL=${tunnel.url}`);
        } else {
          envContent += `\nBASE_URL=${tunnel.url}`;
        }
        
        fs.writeFileSync('.env', envContent);
        console.log('✅ .env file updated automatically!');
      } catch (err) {
        console.log('Could not update .env file automatically:', err.message);
      }
      
      tunnel.on('close', () => {
        console.log('Tunnel closed');
        // Try to restart after a delay
        setTimeout(startTunnel, 5000);
      });
      
      tunnel.on('error', (err) => {
        console.log('Tunnel error:', err);
        tunnel.close();
      });
      
    } catch (error2) {
      console.error('All tunnel attempts failed:', error2.message);
      console.log('Please try again later or use an alternative tunneling service.');
      console.log('Retrying in 30 seconds...');
      setTimeout(startTunnel, 30000);
    }
  }
}

startTunnel();