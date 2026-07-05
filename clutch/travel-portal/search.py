#!/usr/bin/env python3
"""Travel Portal — flight search via Expedia/Travelocity"""
import sys, json, subprocess, time, re
from pathlib import Path

HARNESS = ["browser-harness", "-c"]

def browser_run(script):
    """Run a browser-harness script"""
    result = subprocess.run(
        ["browser-harness", "-c", script],
        capture_output=True, text=True, timeout=120
    )
    return result.stdout

def search_expedia_cruise(destination, month, duration, passengers):
    """Search Expedia for cruises"""
    script = f'''
new_tab("https://www.expedia.com/Cruise-Search?destination={destination}&startDate={month}")
wait_for_load()
print(js("document.body.innerText"))'''
    return browser_run(script)

def search_vacationstogo(destination, month):
    """Search VacationsToGo for cruises"""
    dest_code = destination.replace(" ", "-").lower()
    script = f'''
new_tab("https://www.vacationstogo.com/cruise_search.cfm?dest={dest_code}&month={month}")
wait_for_load()
print(js("document.body.innerText"))'''
    return browser_run(script)

def search_travelocity_flights(origin, dest, depart, return_date):
    """Search Travelocity for flights"""
    script = f'''
new_tab("https://www.travelocity.com/Flights?origin={origin}&destination={dest}&departDate={depart}&returnDate={return_date}")
wait_for_load()
print(js("document.body.innerText"))'''
    return browser_run(script)

def search_expedia_flights(origin, dest, depart, return_date):
    """Search Expedia for flights"""
    script = f'''
new_tab("https://www.expedia.com/Flights-Search?flight-type=on&starDate={depart}&endDate={return_date}&_xpid=11947&flexibility=0_DAY&d1={origin}&o1={dest}")
wait_for_load()
print(js("document.body.innerText"))'''
    return browser_run(script)

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "help"
    
    if cmd == "cruise":
        dest = sys.argv[2] if len(sys.argv) > 2 else "caribbean"
        month = sys.argv[3] if len(sys.argv) > 3 else "2026-07"
        print(f"Searching cruises to {dest} in {month}...")
        
        print("\n--- VacationsToGo ---")
        result = search_vacationstogo(dest, month)
        print(result[:3000])
        
        print("\n--- Expedia Cruises ---")
        result = search_expedia_cruise(dest, month, 7, 2)
        print(result[:3000])
    
    elif cmd == "colorado":
        origin = sys.argv[2] if len(sys.argv) > 2 else "DFW"
        depart = sys.argv[3] if len(sys.argv) > 3 else "2026-06-10"
        ret = sys.argv[4] if len(sys.argv) > 4 else "2026-06-15"
        print(f"Searching Colorado travel from {origin} ({depart} - {ret})...")
        
        print("\n--- Travelocity Flights to Denver ---")
        result = search_travelocity_flights(origin, "DEN", depart, ret)
        print(result[:3000])
        
        print("\n--- Expedia Flights to Denver ---")
        result = search_expedia_flights(origin, "DEN", depart, ret)
        print(result[:3000])
    
    elif cmd == "test":
        print("Testing travel search engines...")
        result = browser_run('''
new_tab("https://www.expedia.com/")
wait_for_load()
print("Expedia: " + ("OK" if "Search" in js("document.body.innerText") else "FAIL"))
new_tab("https://www.travelocity.com/")
wait_for_load()
print("Travelocity: " + ("OK" if "Search" in js("document.body.innerText") else "FAIL"))
new_tab("https://www.vacationstogo.com/")
wait_for_load()
print("VacationsToGo: " + ("OK" if "cruise" in js("document.body.innerText").lower() else "FAIL"))
        ''')
        print(result)
    
    else:
        print("Travel Portal - Trip Search")
        print("  test              — Test search engine access")
        print("  cruise [dest] [month]  — Search cruises")
        print("  colorado [origin] [depart] [return]  — Search Colorado travel")
        print()
        print("Examples:")
        print("  travel-portal cruise alaska 2026-07")
        print("  travel-portal colorado DFW 2026-06-10 2026-06-15")
